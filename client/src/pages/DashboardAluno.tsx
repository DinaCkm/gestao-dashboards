import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { 
  User, 
  Target, 
  Calendar, 
  Award, 
  TrendingUp, 
  BookOpen, 
  Users, 
  CheckCircle2, 
  XCircle,
  Clock,
  BarChart3,
  GraduationCap,
  Zap,
  PartyPopper,
  Info,
  ChevronDown,
  ChevronUp,
  Building2,
  Route,
  Layers,
  Video,
  FileText,
  AlertTriangle,
  Briefcase,
  ClipboardCheck,
  Star,
  Filter,
  HelpCircle,
  MessageSquare,
  Play,
  Trophy,
  Snowflake,
  Lock
} from "lucide-react";
import { InfoTooltip, GLOSSARIO, INDICADORES_INFO } from "@/components/InfoTooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Componente para exibir um indicador individual com tooltip
function IndicadorCard({ 
  label, 
  valor, 
  descricao, 
  icon: Icon, 
  iconBg, 
  iconColor,
  tooltip
}: { 
  label: string; 
  valor: number; 
  descricao: string; 
  icon: any; 
  iconBg: string; 
  iconColor: string;
  tooltip?: string;
}) {
  return (
    <Card className="bg-white text-gray-900 border border-gray-200">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-500 truncate flex items-center gap-1">
              {label}
              {tooltip && <InfoTooltip text={tooltip} />}
            </p>
            <p className="text-xl font-bold">{valor.toFixed(0)}%</p>
          </div>
        </div>
        <Progress value={valor} className="mt-2 h-2" />
        <p className="text-xs text-gray-400 mt-1.5 line-clamp-2">{descricao}</p>
      </CardContent>
    </Card>
  );
}

// Componente para exibir indicadores de um ciclo
function CicloIndicadores({ 
  ciclo, 
  tipo 
}: { 
  ciclo: any; 
  tipo: 'em_andamento' | 'finalizado'; 
}) {
  const [expandido, setExpandido] = useState(tipo === 'em_andamento');
  // IndicadoresCiclo has ind fields at root level
  const ind = ciclo;
  
  const borderColor = tipo === 'em_andamento' ? 'border-l-blue-500' : 'border-l-emerald-500';
  const badgeClass = tipo === 'em_andamento' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800';
  const badgeLabel = tipo === 'em_andamento' ? 'Em Andamento' : 'Finalizado';

  return (
    <Card className={`border-l-4 ${borderColor}`}>
      <Collapsible open={expandido} onOpenChange={setExpandido}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <Layers className="h-5 w-5 text-gray-600 shrink-0" />
                <div className="min-w-0">
                  <CardTitle className="text-base truncate">{ciclo.nomeCiclo}</CardTitle>
                  <CardDescription className="text-xs">
                    {ciclo.dataInicio} a {ciclo.dataFim}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <p className="text-lg font-bold text-[#0A1E3E]">{ind.ind7_engajamentoFinal.toFixed(0)}%</p>
                  <p className="text-xs text-gray-400">Engajamento Final</p>
                </div>
                <Badge className={badgeClass}>{badgeLabel}</Badge>
                {expandido ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Engajamento Final (destaque) */}
            <div className="p-4 bg-gradient-to-r from-[#0A1E3E]/5 to-transparent rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-[#0A1E3E] flex items-center justify-center">
                    <Star className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      Engajamento Final <InfoTooltip text={INDICADORES_INFO.ind7.explicacao} />
                    </p>
                    <p className="text-2xl font-bold text-[#0A1E3E]">{ind.ind7_engajamentoFinal.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
              <Progress value={ind.ind7_engajamentoFinal} className="mt-3 h-3" />
            </div>

            {/* 6 Indicadores individuais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <IndicadorCard
                label="1. Webinars/Aulas Online"
                valor={ind.ind1_webinars}
                descricao={INDICADORES_INFO.ind1.formula}
                icon={Video}
                iconBg="bg-blue-100"
                iconColor="text-blue-600"
                tooltip={INDICADORES_INFO.ind1.explicacao}
              />
              <IndicadorCard
                label="2. Performance nas Avaliações"
                valor={ind.ind2_avaliacoes}
                descricao={INDICADORES_INFO.ind2.formula}
                icon={GraduationCap}
                iconBg="bg-red-100"
                iconColor="text-red-600"
                tooltip={INDICADORES_INFO.ind2.explicacao}
              />
              <IndicadorCard
                label="3. Performance nas Competências"
                valor={ind.ind3_competencias}
                descricao={INDICADORES_INFO.ind3.formula}
                icon={BookOpen}
                iconBg="bg-purple-100"
                iconColor="text-purple-600"
                tooltip={INDICADORES_INFO.ind3.explicacao}
              />
              <IndicadorCard
                label="4. Tarefas Práticas"
                valor={ind.ind4_tarefas}
                descricao={INDICADORES_INFO.ind4.formula}
                icon={ClipboardCheck}
                iconBg="bg-emerald-100"
                iconColor="text-emerald-600"
                tooltip={INDICADORES_INFO.ind4.explicacao}
              />
              <IndicadorCard
                label="5. Engajamento (Nota Mentora)"
                valor={ind.ind5_engajamento}
                descricao={INDICADORES_INFO.ind5.formula}
                icon={Zap}
                iconBg="bg-amber-100"
                iconColor="text-amber-600"
                tooltip={INDICADORES_INFO.ind5.explicacao}
              />
              {tipo === 'finalizado' && (
                <IndicadorCard
                  label="6. Case de Sucesso (Bônus)"
                  valor={ind.ind6_aplicabilidade}
                  descricao={INDICADORES_INFO.ind6.formula}
                  icon={Briefcase}
                  iconBg="bg-rose-100"
                  iconColor="text-rose-600"
                  tooltip={INDICADORES_INFO.ind6.explicacao}
                />
              )}
              {tipo === 'em_andamento' && (
                <Card className="bg-gray-50 text-gray-500 border border-dashed border-gray-300">
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center shrink-0">
                        <Briefcase className="h-5 w-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">6. Aplicabilidade Prática (Case)</p>
                        <p className="text-sm text-gray-400 italic">Avaliado ao final do macrociclo</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Detalhes das competências do ciclo */}
            {ind.detalhes?.competencias?.competenciasDetalhe && ind.detalhes.competencias.competenciasDetalhe.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Competências do Ciclo:</p>
                <div className="flex flex-wrap gap-2">
                  {ind.detalhes.competencias.competenciasDetalhe.map((comp: any, idx: number) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {comp.nome || `Comp. ${idx + 1}`}
                      {comp.concluida && <CheckCircle2 className="h-3 w-3 ml-1 text-emerald-500 inline" />}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export default function DashboardAluno() {
  const { user } = useAuth();
  const isGerente = user?.role === 'manager';
  const [selectedAlunoId, setSelectedAlunoId] = useState<number | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState<string>(() => {
    // Gerente só vê a empresa dele - inicializar com o programId do gerente
    return "all";
  });
  const [indicadorFiltro, setIndicadorFiltro] = useState<string>("consolidado");
  const [showGlossario, setShowGlossario] = useState(false);

  // Se for gerente, forçar o filtro para a empresa dele
  useEffect(() => {
    if (isGerente && user?.programId) {
      setSelectedProgramId(String(user.programId));
    }
  }, [isGerente, user?.programId]);

  // Ler query param ?id= da URL para pré-selecionar aluno (ex: vindo do Dashboard Gestor)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get('id');
    if (idParam) {
      const id = parseInt(idParam);
      if (!isNaN(id)) {
        setSelectedAlunoId(id);
      }
    }
  }, []);

  // Buscar lista de programas
  const { data: programs = [] } = trpc.programs.list.useQuery();
  
  // Buscar lista de alunos
  const { data: alunos = [] } = trpc.alunos.list.useQuery(
    selectedProgramId !== "all" ? { programId: parseInt(selectedProgramId) } : undefined
  );

  // Buscar performance filtrada do aluno selecionado
  const { data: performanceData, isLoading: loadingPerformance } = trpc.indicadores.performanceFiltrada.useQuery(
    { alunoId: selectedAlunoId! },
    { enabled: !!selectedAlunoId }
  );

  // Buscar detalhe completo do aluno (competências, eventos, turma, trilha, ciclo)
  const { data: detalheAluno, isLoading: loadingDetalhe } = trpc.indicadores.detalheAluno.useQuery(
    { alunoId: selectedAlunoId! },
    { enabled: !!selectedAlunoId }
  );

  // Buscar progresso de sessões do aluno (baseado no Assessment PDI macro ciclo)
  const { data: sessionProgress } = trpc.mentor.sessionProgress.useQuery(
    { alunoId: selectedAlunoId! },
    { enabled: !!selectedAlunoId }
  );

  // Aluno selecionado
  const selectedAluno = useMemo(() => {
    return alunos.find(a => a.id === selectedAlunoId);
  }, [alunos, selectedAlunoId]);

  // Programa do aluno
  const alunoProgram = useMemo(() => {
    if (!selectedAluno?.programId) return null;
    return programs.find(p => p.id === selectedAluno.programId);
  }, [selectedAluno, programs]);

  // Função para obter cor do estágio
  const getEstagioColor = (estagio: string) => {
    switch (estagio) {
      case 'Excelência': return 'bg-emerald-500';
      case 'Avançado': return 'bg-blue-500';
      case 'Intermediário': return 'bg-amber-500';
      case 'Básico': return 'bg-orange-500';
      case 'Inicial': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Função para obter cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluida': return 'bg-emerald-100 text-emerald-800';
      case 'em_progresso': return 'bg-blue-100 text-blue-800';
      case 'pendente': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Função para obter label do status
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'concluida': return 'Concluída';
      case 'em_progresso': return 'Em Progresso';
      case 'pendente': return 'Pendente';
      default: return status;
    }
  };

  const formatDate = (d: string | Date | null | undefined) => {
    if (!d) return '—';
    const date = typeof d === 'string' ? new Date(d) : d;
    return date.toLocaleDateString('pt-BR');
  };

  // Dados de indicadores
  const v2 = performanceData?.indicadoresV2;

  // Filtro de indicadores: opções disponíveis
  const filtroOpcoes = useMemo(() => {
    if (!v2) return [];
    const opcoes: { value: string; label: string }[] = [
      { value: 'consolidado', label: '⭐ Consolidado (Todos os ciclos finalizados)' },
    ];
    // Agrupar ciclos por trilha (macrociclo)
    const trilhas = new Set<string>();
    [...(v2.ciclosFinalizados || []), ...(v2.ciclosEmAndamento || [])].forEach((c: any) => {
      const trilhaNome = c.nomeCiclo?.split(' - ')?.[0] || c.nomeCiclo;
      if (trilhaNome) trilhas.add(trilhaNome);
    });
    Array.from(trilhas).forEach(t => {
      opcoes.push({ value: `trilha:${t}`, label: `📍 Trilha: ${t}` });
    });
    // Ciclos individuais
    (v2.ciclosFinalizados || []).forEach((c: any, idx: number) => {
      opcoes.push({ value: `finalizado:${idx}`, label: `✅ ${c.nomeCiclo} (Finalizado)` });
    });
    (v2.ciclosEmAndamento || []).forEach((c: any, idx: number) => {
      opcoes.push({ value: `andamento:${idx}`, label: `⏳ ${c.nomeCiclo} (Em Andamento)` });
    });
    return opcoes;
  }, [v2]);

  // Dados filtrados dos indicadores
  const v2Filtrado = useMemo(() => {
    if (!v2) return null;
    if (indicadorFiltro === 'consolidado') return v2.consolidado;
    if (indicadorFiltro.startsWith('trilha:')) {
      const trilhaNome = indicadorFiltro.replace('trilha:', '');
      const ciclosDaTrilha = [
        ...(v2.ciclosFinalizados || []).filter((c: any) => c.nomeCiclo?.startsWith(trilhaNome)),
        ...(v2.ciclosEmAndamento || []).filter((c: any) => c.nomeCiclo?.startsWith(trilhaNome)),
      ];
      if (ciclosDaTrilha.length === 0) return v2.consolidado;
      // Média dos ciclos da trilha
      const soma = { ind1: 0, ind2: 0, ind3: 0, ind4: 0, ind5: 0, ind6: 0, ind7: 0 };
      ciclosDaTrilha.forEach((c: any) => {
        soma.ind1 += c.ind1_webinars || 0;
        soma.ind2 += c.ind2_avaliacoes || 0;
        soma.ind3 += c.ind3_competencias || 0;
        soma.ind4 += c.ind4_tarefas || 0;
        soma.ind5 += c.ind5_engajamento || 0;
        soma.ind6 += c.ind6_aplicabilidade || 0;
        soma.ind7 += c.ind7_engajamentoFinal || 0;
      });
      const n = ciclosDaTrilha.length;
      return {
        ind1_webinars: soma.ind1 / n,
        ind2_avaliacoes: soma.ind2 / n,
        ind3_competencias: soma.ind3 / n,
        ind4_tarefas: soma.ind4 / n,
        ind5_engajamento: soma.ind5 / n,
        ind6_aplicabilidade: soma.ind6 / n,
        ind7_engajamentoFinal: soma.ind7 / n,
      };
    }
    if (indicadorFiltro.startsWith('finalizado:')) {
      const idx = parseInt(indicadorFiltro.replace('finalizado:', ''));
      return v2.ciclosFinalizados?.[idx] || v2.consolidado;
    }
    if (indicadorFiltro.startsWith('andamento:')) {
      const idx = parseInt(indicadorFiltro.replace('andamento:', ''));
      return v2.ciclosEmAndamento?.[idx] || v2.consolidado;
    }
    return v2.consolidado;
  }, [v2, indicadorFiltro]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard do Aluno</h1>
            <p className="text-gray-500">Performance individual com indicadores por ciclo</p>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-[#0A1E3E]" />
              Selecionar Aluno
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Empresa/Programa</label>
                <Select value={selectedProgramId} onValueChange={setSelectedProgramId} disabled={isGerente}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as empresas" />
                  </SelectTrigger>
                  <SelectContent>
                    {!isGerente && <SelectItem value="all">Todas as empresas</SelectItem>}
                    {programs
                      .filter(p => isGerente ? p.id === user?.programId : true)
                      .map(p => (
                        <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Aluno</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 appearance-none cursor-pointer"
                  value={selectedAlunoId !== null ? String(selectedAlunoId) : ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") {
                      setSelectedAlunoId(null);
                    } else {
                      const id = parseInt(val);
                      if (!isNaN(id)) setSelectedAlunoId(id);
                    }
                  }}
                >
                  <option value="">Selecione um aluno</option>
                  {[...alunos].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')).map(a => (
                    <option key={a.id} value={String(a.id)}>{a.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conteúdo do Dashboard */}
        {selectedAlunoId && (
          <>
            {/* Informações do Aluno */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#0A1E3E] to-[#2D5A87] flex items-center justify-center shrink-0">
                    <GraduationCap className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-gray-900">{selectedAluno?.name}</h2>
                    {selectedAluno?.email && (
                      <p className="text-sm text-gray-500 mt-0.5">{selectedAluno.email}</p>
                    )}
                    
                    {/* Info cards: Empresa, Turma, Trilha, Ciclo, Mentor */}
                    {detalheAluno && (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Building2 className="h-3.5 w-3.5 text-blue-600" />
                            <span className="text-xs font-medium text-blue-600">Empresa</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900 truncate">{detalheAluno.programa?.name || 'Não definido'}</p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-lg">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Users className="h-3.5 w-3.5 text-purple-600" />
                            <span className="text-xs font-medium text-purple-600">Turma</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900 truncate">{detalheAluno.turma?.name || 'Não definida'}</p>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-lg">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Route className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="text-xs font-medium text-emerald-600">Trilha</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900 truncate">{detalheAluno.trilha}</p>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-lg">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Layers className="h-3.5 w-3.5 text-amber-600" />
                            <span className="text-xs font-medium text-amber-600">Ciclo Atual</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {detalheAluno.ciclos.filter(c => c.status === 'em_andamento').length > 0
                              ? detalheAluno.ciclos.filter(c => c.status === 'em_andamento')[0].nomeCiclo
                              : detalheAluno.ciclos.length > 0
                                ? `${detalheAluno.ciclos.length} ciclo(s)`
                                : 'Nenhum ciclo'}
                          </p>
                        </div>
                        <div className="p-3 bg-rose-50 rounded-lg">
                          <div className="flex items-center gap-1.5 mb-1">
                            <User className="h-3.5 w-3.5 text-rose-600" />
                            <span className="text-xs font-medium text-rose-600">Mentor</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900 truncate">{detalheAluno.mentor?.name || 'Não definido'}</p>
                        </div>
                      </div>
                    )}
                    {/* Aviso de PDI congelado */}
                    {detalheAluno?.temPdiCongelado && detalheAluno.pdisCongelados?.length > 0 && (
                      <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
                        <div className="flex items-center gap-2 mb-1">
                          <Snowflake className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-semibold text-blue-800">
                            <Lock className="h-3.5 w-3.5 inline mr-1" />
                            Trilha(s) Congelada(s)
                          </span>
                        </div>
                        <p className="text-xs text-blue-700 mb-2">
                          Este aluno possui <strong>{detalheAluno.pdisCongelados.length} trilha(s) congelada(s)</strong>. 
                          Os indicadores de performance <strong>não consideram</strong> trilhas congeladas. Se a performance está zerada ou baixa, pode ser por este motivo.
                        </p>
                        {detalheAluno.pdisCongelados.map((pdi: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-blue-700 bg-white/60 rounded px-2 py-1 mt-1">
                            <Snowflake className="h-3 w-3 flex-shrink-0" />
                            <span className="font-medium">{pdi.trilhaNome}</span>
                            {pdi.motivoCongelamento && <span className="italic">— {pdi.motivoCongelamento}</span>}
                            {pdi.congeladoEm && (
                              <span className="text-blue-500 ml-auto">
                                ({new Date(pdi.congeladoEm).toLocaleDateString('pt-BR')})
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Consolidado */}
                  {v2?.consolidado && (
                    <div className="text-center shrink-0">
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0A1E3E] text-white">
                        <Star className="h-5 w-5" />
                        <span className="font-semibold">Consolidado</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {v2.consolidado.ind7_engajamentoFinal.toFixed(0)}%
                      </p>
                      <p className="text-sm text-gray-500">Engajamento Final</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>



            {/* Glossário de Termos */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <button
                  onClick={() => setShowGlossario(!showGlossario)}
                  className="flex items-center gap-2 w-full text-left"
                >
                  <HelpCircle className="h-5 w-5 text-[#F5991F]" />
                  <span className="text-sm font-semibold text-gray-700">Glossário de Termos do Programa</span>
                  <InfoTooltip text="Clique para expandir e ver a explicação de cada termo usado no sistema" />
                  {showGlossario ? <ChevronUp className="h-4 w-4 text-gray-400 ml-auto" /> : <ChevronDown className="h-4 w-4 text-gray-400 ml-auto" />}
                </button>
                {showGlossario && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {([
                      { termo: "Jornada", desc: GLOSSARIO.jornada, icon: Award, color: "bg-indigo-50 border-indigo-200 text-indigo-700" },
                      { termo: "Macrociclo", desc: GLOSSARIO.macrociclo, icon: Target, color: "bg-blue-50 border-blue-200 text-blue-700" },
                      { termo: "Trilha", desc: GLOSSARIO.trilha, icon: TrendingUp, color: "bg-purple-50 border-purple-200 text-purple-700" },
                      { termo: "Microciclo", desc: GLOSSARIO.microciclo, icon: Clock, color: "bg-cyan-50 border-cyan-200 text-cyan-700" },
                      { termo: "Competência", desc: GLOSSARIO.competencia, icon: BookOpen, color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
                      { termo: "Aula", desc: GLOSSARIO.aula, icon: GraduationCap, color: "bg-amber-50 border-amber-200 text-amber-700" },
                      { termo: "Webinar", desc: GLOSSARIO.webinar, icon: Video, color: "bg-orange-50 border-orange-200 text-orange-700" },
                      { termo: "Mentoria", desc: GLOSSARIO.mentoria, icon: MessageSquare, color: "bg-pink-50 border-pink-200 text-pink-700" },
                      { termo: "Tarefa Prática", desc: GLOSSARIO.tarefa, icon: ClipboardCheck, color: "bg-teal-50 border-teal-200 text-teal-700" },
                      { termo: "Case de Sucesso", desc: GLOSSARIO.caseSucesso, icon: Briefcase, color: "bg-rose-50 border-rose-200 text-rose-700" },
                    ]).map(({ termo, desc, icon: Icon, color }) => (
                      <div key={termo} className={`p-3 rounded-lg border ${color}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className="h-4 w-4" />
                          <span className="text-sm font-semibold">{termo}</span>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">{desc}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Alerta de Case Pendente */}
            {v2?.alertaCasePendente && v2.alertaCasePendente.length > 0 && (
              <Card className="border-2 border-amber-400 bg-amber-50">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-800">Alerta: Case de Sucesso Pendente</p>
                      {v2.alertaCasePendente.map((alerta: any, idx: number) => (
                        <p key={idx} className="text-sm text-amber-700 mt-1">
                          O ciclo <strong>{alerta.cicloNome}</strong> está finalizando 
                          {alerta.dataFim && ` (término: ${new Date(alerta.dataFim).toLocaleDateString('pt-BR')})`}. 
                          O aluno precisa entregar o <strong>Case de Sucesso</strong> para completar a avaliação do macrociclo.
                        </p>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tabs de Conteúdo */}
            <Tabs defaultValue="indicadores" className="space-y-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="indicadores">Indicadores</TabsTrigger>
                <TabsTrigger value="competencias">Competências</TabsTrigger>
                <TabsTrigger value="eventos">Eventos</TabsTrigger>
                <TabsTrigger value="ciclos">Ciclos</TabsTrigger>
                <TabsTrigger value="historico">Histórico</TabsTrigger>
              </TabsList>

              {/* Tab Indicadores - Por Ciclo */}
              <TabsContent value="indicadores" className="space-y-4">
                {loadingPerformance ? (
                  <Card>
                    <CardContent className="py-8 text-center text-gray-500">
                      Carregando indicadores...
                    </CardContent>
                  </Card>
                ) : v2 ? (
                  <>
                    {/* Filtro de Período */}
                    {filtroOpcoes.length > 0 && (
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Filter className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-600">Visualizar indicadores por:</span>
                          <InfoTooltip text="Selecione o período para filtrar os indicadores. O consolidado mostra a média de todos os ciclos finalizados. Você também pode filtrar por trilha ou por microciclo específico." />
                        </div>
                        <Select value={indicadorFiltro} onValueChange={setIndicadorFiltro}>
                          <SelectTrigger className="w-[350px] bg-white">
                            <SelectValue placeholder="Selecione o período" />
                          </SelectTrigger>
                          <SelectContent>
                            {filtroOpcoes.map((opcao) => (
                              <SelectItem key={opcao.value} value={opcao.value}>
                                {opcao.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Consolidado/Filtrado */}
                    {v2Filtrado && (
                      <Card className="border-2 border-[#0A1E3E]">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 rounded-lg bg-[#0A1E3E] flex items-center justify-center">
                                <Target className="h-6 w-6 text-white" />
                              </div>
                              <div>
                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                  Engajamento Final
                                  <InfoTooltip text={INDICADORES_INFO.ind7.explicacao} />
                                </p>
                                <p className="text-3xl font-bold text-[#0A1E3E]">{(v2Filtrado.ind7_engajamentoFinal ?? 0).toFixed(0)}%</p>
                              </div>
                            </div>
                          </div>
                          <Progress value={v2Filtrado.ind7_engajamentoFinal ?? 0} className="h-3" />
                          <p className="text-xs text-gray-400 mt-2">
                            {indicadorFiltro === 'consolidado' 
                              ? 'Média de todos os ciclos finalizados' 
                              : `Filtrado por: ${filtroOpcoes.find(o => o.value === indicadorFiltro)?.label || indicadorFiltro}`}
                          </p>
                          
                          {/* Mini resumo dos 5 indicadores + bônus case */}
                          <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mt-4">
                            <div className="text-center p-2 bg-blue-50 rounded">
                              <p className="text-lg font-bold text-blue-700">{(v2Filtrado.ind1_webinars ?? 0).toFixed(0)}%</p>
                              <p className="text-[10px] text-gray-500 flex items-center justify-center gap-0.5">Webinars <InfoTooltip text={INDICADORES_INFO.ind1.explicacao} /></p>
                            </div>
                            <div className="text-center p-2 bg-red-50 rounded">
                              <p className="text-lg font-bold text-red-700">{(v2Filtrado.ind2_avaliacoes ?? 0).toFixed(0)}%</p>
                              <p className="text-[10px] text-gray-500 flex items-center justify-center gap-0.5">Avaliações <InfoTooltip text={INDICADORES_INFO.ind2.explicacao} /></p>
                            </div>
                            <div className="text-center p-2 bg-purple-50 rounded">
                              <p className="text-lg font-bold text-purple-700">{(v2Filtrado.ind3_competencias ?? 0).toFixed(0)}%</p>
                              <p className="text-[10px] text-gray-500 flex items-center justify-center gap-0.5">Competências <InfoTooltip text={INDICADORES_INFO.ind3.explicacao} /></p>
                            </div>
                            <div className="text-center p-2 bg-emerald-50 rounded">
                              <p className="text-lg font-bold text-emerald-700">{(v2Filtrado.ind4_tarefas ?? 0).toFixed(0)}%</p>
                              <p className="text-[10px] text-gray-500 flex items-center justify-center gap-0.5">Tarefas <InfoTooltip text={INDICADORES_INFO.ind4.explicacao} /></p>
                            </div>
                            <div className="text-center p-2 bg-amber-50 rounded">
                              <p className="text-lg font-bold text-amber-700">{(v2Filtrado.ind5_engajamento ?? 0).toFixed(0)}%</p>
                              <p className="text-[10px] text-gray-500 flex items-center justify-center gap-0.5">Engajamento <InfoTooltip text={INDICADORES_INFO.ind5.explicacao} /></p>
                            </div>
                          </div>
                          {v2Filtrado.ind6_aplicabilidade > 0 && (
                            <p className="text-xs text-green-600 mt-2 font-medium">✅ Case de Sucesso entregue (+10% no Engajamento)</p>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Todos os Ciclos — ordenados do mais recente para o mais antigo */}
                    {(() => {
                      const todosOsCiclos = [
                        ...(v2.ciclosEmAndamento || []).map((c: any) => ({ ...c, _tipo: 'em_andamento' as const })),
                        ...(v2.ciclosFinalizados || []).map((c: any) => ({ ...c, _tipo: 'finalizado' as const })),
                      ].sort((a, b) => {
                        // Em andamento primeiro, depois por data decrescente
                        if (a._tipo === 'em_andamento' && b._tipo !== 'em_andamento') return -1;
                        if (a._tipo !== 'em_andamento' && b._tipo === 'em_andamento') return 1;
                        const dateA = new Date(a.dataFim || a.dataInicio || 0).getTime();
                        const dateB = new Date(b.dataFim || b.dataInicio || 0).getTime();
                        return dateB - dateA;
                      });
                      if (todosOsCiclos.length === 0) {
                        return (
                          <Card>
                            <CardContent className="py-8 text-center text-gray-500">
                              <Layers className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                              <p>Nenhum ciclo encontrado para este aluno.</p>
                              <p className="text-sm mt-2">Os indicadores serão calculados quando ciclos forem definidos.</p>
                            </CardContent>
                          </Card>
                        );
                      }
                      return (
                        <div className="space-y-3">
                          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <Layers className="h-5 w-5 text-gray-600" />
                            Ciclos por Competência
                            <span className="text-sm font-normal text-gray-400">({todosOsCiclos.length} ciclo{todosOsCiclos.length !== 1 ? 's' : ''})</span>
                          </h3>
                          {todosOsCiclos.map((ciclo: any, idx: number) => (
                            <CicloIndicadores key={`ciclo-${idx}`} ciclo={ciclo} tipo={ciclo._tipo} />
                          ))}
                        </div>
                      );
                    })()}
                  </>
                ) : performanceData ? (
                  /* Fallback: indicadores não disponíveis */
                  <Card>
                    <CardContent className="py-8 text-center text-gray-500">
                      <Info className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Indicadores não disponíveis para este aluno.</p>
                      <p className="text-sm mt-2">Verifique se os ciclos estão configurados corretamente.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center text-gray-500">
                      Nenhum dado de performance encontrado para este aluno.
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Tab Competências - Agrupadas por Trilha com Notas */}
              <TabsContent value="competencias" className="space-y-4">
                {loadingDetalhe ? (
                  <Card>
                    <CardContent className="py-8 text-center text-gray-500">
                      Carregando competências...
                    </CardContent>
                  </Card>
                ) : detalheAluno && Object.keys(detalheAluno.competencias).length > 0 ? (
                  <>
                    {/* Resumo */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="pt-6 text-center">
                          <p className="text-3xl font-bold text-[#0A1E3E]">{detalheAluno.totalCompetencias}</p>
                          <p className="text-sm text-gray-500">Total de Competências</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6 text-center">
                          <p className="text-3xl font-bold text-emerald-600">{detalheAluno.competenciasAprovadas}</p>
                          <p className="text-sm text-gray-500">Aprovadas (nota ≥ 7)</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6 text-center">
                          <p className="text-3xl font-bold text-amber-600">{detalheAluno.mediaNotas.toFixed(1)}</p>
                          <p className="text-sm text-gray-500">Média das Notas</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Competências agrupadas por trilha */}
                    {Object.entries(detalheAluno.competencias).map(([trilhaNome, comps]) => (
                      <Card key={trilhaNome}>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-base">
                            <Route className="h-4 w-4 text-[#0A1E3E]" />
                            Trilha: {trilhaNome}
                            <Badge variant="outline" className="ml-2">{(comps as any[]).length} competências</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Competência</TableHead>
                                <TableHead className="w-24 text-center">Status</TableHead>
                                <TableHead className="w-20 text-center">Nota</TableHead>
                                <TableHead className="w-20 text-center">Meta</TableHead>
                                <TableHead className="w-24 text-center">Resultado</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(comps as any[]).map((comp: any, idx: number) => (
                                <TableRow key={idx}>
                                  <TableCell className="font-medium">{comp.competenciaNome}</TableCell>
                                  <TableCell className="text-center">
                                    <Badge className={getStatusColor(comp.status)}>
                                      {getStatusLabel(comp.status)}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {comp.notaAtual ? (
                                      <span className={`font-bold ${parseFloat(comp.notaAtual) >= 7 ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {parseFloat(comp.notaAtual).toFixed(1)}
                                      </span>
                                    ) : '—'}
                                  </TableCell>
                                  <TableCell className="text-center text-gray-500">
                                    {comp.metaNota ? parseFloat(comp.metaNota).toFixed(1) : '7.0'}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {comp.notaAtual ? (
                                      parseFloat(comp.notaAtual) >= parseFloat(comp.metaNota || '7') ? (
                                        <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto" />
                                      ) : (
                                        <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                                      )
                                    ) : (
                                      <Clock className="h-5 w-5 text-gray-400 mx-auto" />
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    ))}
                  </>
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center text-gray-500">
                      <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Nenhuma competência definida para este aluno.</p>
                      <p className="text-sm mt-2">Acesse o menu "Plano Individual" para definir as competências.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Tab Eventos/Webinários */}
              <TabsContent value="eventos" className="space-y-4">
                {loadingDetalhe ? (
                  <Card>
                    <CardContent className="py-8 text-center text-gray-500">
                      Carregando eventos...
                    </CardContent>
                  </Card>
                ) : detalheAluno && detalheAluno.eventos.length > 0 ? (
                  <>
                    {/* Resumo de eventos */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="pt-6 text-center">
                          <p className="text-3xl font-bold text-[#0A1E3E]">{detalheAluno.totalEventos}</p>
                          <p className="text-sm text-gray-500">Total de Eventos</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6 text-center">
                          <p className="text-3xl font-bold text-emerald-600">{detalheAluno.eventosPresente}</p>
                          <p className="text-sm text-gray-500">Participações</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6 text-center">
                          <p className="text-3xl font-bold text-amber-600">
                            {detalheAluno.totalEventos > 0 
                              ? ((detalheAluno.eventosPresente / detalheAluno.totalEventos) * 100).toFixed(0) 
                              : 0}%
                          </p>
                          <p className="text-sm text-gray-500">Taxa de Participação</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Tabela de eventos */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Video className="h-5 w-5 text-[#0A1E3E]" />
                          Eventos e Webinários
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Evento</TableHead>
                              <TableHead className="w-28">Tipo</TableHead>
                              <TableHead className="w-28">Data</TableHead>
                              <TableHead className="w-28 text-center">Presença</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {detalheAluno.eventos.map((evento) => (
                              <TableRow key={evento.id}>
                                <TableCell className="font-medium">{evento.titulo}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="capitalize">{evento.tipo}</Badge>
                                </TableCell>
                                <TableCell className="text-gray-500">{formatDate(evento.data)}</TableCell>
                                <TableCell className="text-center">
                                  {evento.status === 'presente' ? (
                                    <Badge className="bg-emerald-100 text-emerald-800">Presente</Badge>
                                  ) : (
                                    <Badge className="bg-red-100 text-red-800">Ausente</Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center text-gray-500">
                      <PartyPopper className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Nenhum evento registrado para este aluno.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Tab Ciclos */}
              <TabsContent value="ciclos" className="space-y-4">
                {loadingDetalhe ? (
                  <Card>
                    <CardContent className="py-8 text-center text-gray-500">
                      Carregando ciclos...
                    </CardContent>
                  </Card>
                ) : detalheAluno && detalheAluno.ciclos.length > 0 ? (
                  <>
                    {detalheAluno.ciclos.map((ciclo) => (
                      <Card key={ciclo.id} className={ciclo.status === 'em_andamento' ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-emerald-500'}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-base">
                              <Layers className="h-4 w-4" />
                              {ciclo.nomeCiclo}
                            </CardTitle>
                            <Badge className={ciclo.status === 'em_andamento' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}>
                              {ciclo.status === 'em_andamento' ? 'Em Andamento' : 'Finalizado'}
                            </Badge>
                          </div>
                          <CardDescription>
                            {formatDate(ciclo.dataInicio)} a {formatDate(ciclo.dataFim)}
                            {ciclo.observacoes && ` — ${ciclo.observacoes}`}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm font-medium text-gray-700 mb-2">Competências do Ciclo:</p>
                          <div className="flex flex-wrap gap-2">
                            {ciclo.competencias.map((comp: any) => (
                              <Badge key={comp.id} variant="outline" className="text-xs">
                                {comp.competenciaNome} ({comp.trilhaNome})
                              </Badge>
                            ))}
                          </div>
                          {ciclo.competencias.length === 0 && (
                            <p className="text-sm text-gray-400">Nenhuma competência vinculada a este ciclo.</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </>
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center text-gray-500">
                      <Layers className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Nenhum ciclo de execução definido para este aluno.</p>
                      <p className="text-sm mt-2">Os ciclos são definidos pela mentora durante o Assessment.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Tab Histórico */}
              <TabsContent value="historico" className="space-y-4">
                {/* Sessões de Mentoria */}
                {detalheAluno && detalheAluno.sessoes.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-[#0A1E3E]" />
                        Sessões de Mentoria
                      </CardTitle>
                      <CardDescription>
                        {detalheAluno.mentoriasPresente} presenças de {detalheAluno.totalMentorias} sessões
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-16">Sessão</TableHead>
                            <TableHead className="w-24">Ciclo</TableHead>
                            <TableHead className="w-28">Data</TableHead>
                            <TableHead className="w-24 text-center">Presença</TableHead>
                            <TableHead className="w-28 text-center">Atividade</TableHead>
                            <TableHead className="w-32 text-center">Nível de Engajamento</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {detalheAluno.sessoes.map((sessao) => (
                            <TableRow key={sessao.id}>
                              <TableCell className="font-medium">#{sessao.sessionNumber || '—'}</TableCell>
                              <TableCell>{sessao.ciclo || '—'}</TableCell>
                              <TableCell className="text-gray-500">{formatDate(sessao.sessionDate)}</TableCell>
                              <TableCell className="text-center">
                                {sessao.presence === 'presente' ? (
                                  <Badge className="bg-emerald-100 text-emerald-800">Presente</Badge>
                                ) : (
                                  <Badge className="bg-red-100 text-red-800">Ausente</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {sessao.taskStatus === 'entregue' ? (
                                  <Badge className="bg-emerald-100 text-emerald-800">Entregue</Badge>
                                ) : sessao.taskStatus === 'nao_entregue' ? (
                                  <Badge className="bg-red-100 text-red-800">Não entregue</Badge>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {sessao.sessionNumber === 1 ? (
                                  <span className="text-gray-400 text-xs italic">N/A (1ª sessão)</span>
                                ) : (() => {
                                  const nota = sessao.notaEvolucao ?? sessao.engagementScore;
                                  if (nota == null) return <span className="text-gray-400">—</span>;
                                  const stageLabel = nota >= 9 ? 'Excelência' : nota >= 7 ? 'Avançado' : nota >= 5 ? 'Intermediário' : nota >= 3 ? 'Básico' : 'Inicial';
                                  const stageColor = nota >= 9 ? 'bg-emerald-100 text-emerald-800' : nota >= 7 ? 'bg-blue-100 text-blue-800' : nota >= 5 ? 'bg-amber-100 text-amber-800' : nota >= 3 ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800';
                                  return (
                                    <div className="flex flex-col items-center gap-0.5">
                                      <span className="font-bold">{nota}/10</span>
                                      <Badge className={`text-xs ${stageColor}`}>{stageLabel}</Badge>
                                    </div>
                                  );
                                })()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Nenhuma sessão de mentoria registrada.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}

        {/* Mensagem quando nenhum aluno selecionado */}
        {!selectedAlunoId && (
          <Card>
            <CardContent className="py-12 text-center">
              <User className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Selecione um Aluno</h3>
              <p className="text-gray-500">
                Use os filtros acima para selecionar um aluno e visualizar seu dashboard individual.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
