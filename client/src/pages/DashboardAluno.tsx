import { useState, useMemo } from "react";
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
  FileText
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function DashboardAluno() {
  const [selectedAlunoId, setSelectedAlunoId] = useState<number | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState<string>("all");

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard do Aluno</h1>
            <p className="text-gray-500">Performance individual com histórico e plano de desenvolvimento</p>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-[#1B3A5D]" />
              Selecionar Aluno
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Empresa/Programa</label>
                <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as empresas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as empresas</SelectItem>
                    {programs.map(p => (
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
            {/* Informações do Aluno - Card com turma, trilha, programa, mentor */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#1B3A5D] to-[#2D5A87] flex items-center justify-center shrink-0">
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
                  </div>
                  {performanceData && (
                    <div className="text-center shrink-0">
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${getEstagioColor(performanceData.indicadores.classificacao)} text-white`}>
                        <Award className="h-5 w-5" />
                        <span className="font-semibold">{performanceData.indicadores.classificacao}</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {(performanceData.indicadores.performanceGeral || 0).toFixed(0)}%
                      </p>
                      <p className="text-sm text-gray-500">Performance Geral</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tabs de Conteúdo */}
            <Tabs defaultValue="indicadores" className="space-y-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="indicadores">Indicadores</TabsTrigger>
                <TabsTrigger value="competencias">Competências</TabsTrigger>
                <TabsTrigger value="eventos">Eventos</TabsTrigger>
                <TabsTrigger value="ciclos">Ciclos</TabsTrigger>
                <TabsTrigger value="historico">Histórico</TabsTrigger>
              </TabsList>

              {/* Tab Indicadores */}
              <TabsContent value="indicadores" className="space-y-4">
                {loadingPerformance ? (
                  <Card>
                    <CardContent className="py-8 text-center text-gray-500">
                      Carregando indicadores...
                    </CardContent>
                  </Card>
                ) : performanceData ? (
                  <>
                    {/* Card Performance Geral (destaque) */}
                    <Card className="border-2 border-[#1B3A5D]">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-lg bg-[#1B3A5D] flex items-center justify-center">
                              <Target className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Ind. 7: Performance Geral</p>
                              <p className="text-3xl font-bold text-[#1B3A5D]">{(performanceData.indicadores.performanceGeral || 0).toFixed(0)}%</p>
                            </div>
                          </div>
                          <div className={`px-4 py-2 rounded-full ${getEstagioColor(performanceData.indicadores.classificacao)} text-white font-semibold`}>
                            {performanceData.indicadores.classificacao}
                          </div>
                        </div>
                        <Progress value={performanceData.indicadores.performanceGeral || 0} className="mt-3 h-3" />
                        <p className="text-xs text-gray-400 mt-2">Média dos 6 indicadores abaixo (peso igual)</p>
                      </CardContent>
                    </Card>

                    {/* Progresso do Ciclo Macro */}
                    {sessionProgress && (
                      <Card className="border border-[#1B3A5D]/20 bg-gradient-to-r from-[#1B3A5D]/5 to-transparent">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-[#1B3A5D]/10 flex items-center justify-center">
                                <Clock className="h-5 w-5 text-[#1B3A5D]" />
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Progresso do Ciclo Macro</p>
                                <p className="text-xl font-bold text-[#1B3A5D]">
                                  {sessionProgress.sessoesRealizadas}/{sessionProgress.totalSessoesEsperadas} sessões
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-[#1B3A5D]">{sessionProgress.percentualProgresso}%</p>
                              {sessionProgress.cicloCompleto ? (
                                <Badge className="bg-emerald-100 text-emerald-800 border-0 mt-1">
                                  <Award className="h-3 w-3 mr-1" /> Ciclo Completo
                                </Badge>
                              ) : sessionProgress.faltaUmaSessao ? (
                                <Badge className="bg-amber-100 text-amber-800 border-0 mt-1 animate-pulse">
                                  Falta 1 sessão!
                                </Badge>
                              ) : (
                                <p className="text-xs text-gray-500 mt-1">Faltam {sessionProgress.sessoesFaltantes} sessões para o término do Macro-Ciclo</p>
                              )}
                            </div>
                          </div>
                          <Progress value={sessionProgress.percentualProgresso} className="h-2" />
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">
                              {sessionProgress.macroInicio ? new Date(sessionProgress.macroInicio).toLocaleDateString('pt-BR') : ''}
                              {' → '}
                              {sessionProgress.macroTermino ? new Date(sessionProgress.macroTermino).toLocaleDateString('pt-BR') : ''}
                            </span>
                            <span className="text-xs text-gray-400">Sessões mensais</span>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* 6 Indicadores individuais */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Ind 1 - Mentorias */}
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                              <Calendar className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Ind. 1: Mentorias</p>
                              <p className="text-xl font-bold">{performanceData.indicadores.participacaoMentorias.toFixed(0)}%</p>
                            </div>
                          </div>
                          <Progress value={performanceData.indicadores.participacaoMentorias} className="mt-3 h-2" />
                          <p className="text-xs text-gray-400 mt-2">
                            {performanceData.indicadores.mentoriasPresente || 0} presenças de {performanceData.indicadores.totalMentorias || 0} sessões
                          </p>
                        </CardContent>
                      </Card>

                      {/* Ind 2 - Atividades */}
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Ind. 2: Atividades</p>
                              <p className="text-xl font-bold">{performanceData.indicadores.atividadesPraticas.toFixed(0)}%</p>
                            </div>
                          </div>
                          <Progress value={performanceData.indicadores.atividadesPraticas} className="mt-3 h-2" />
                          <p className="text-xs text-gray-400 mt-2">1ª mentoria (Assessment) excluída do cálculo</p>
                        </CardContent>
                      </Card>

                      {/* Ind 3 - Engajamento */}
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                              <Zap className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Ind. 3: Engajamento</p>
                              <p className="text-xl font-bold">{performanceData.indicadores.engajamento.toFixed(0)}%</p>
                            </div>
                          </div>
                          <Progress value={performanceData.indicadores.engajamento} className="mt-3 h-2" />
                          <p className="text-xs text-gray-400 mt-2">Média de 3 componentes base 100: presença (100/0) + tarefa (100/0) + nota evolução (nota/10×100)</p>
                        </CardContent>
                      </Card>

                      {/* Ind 4 - Competências */}
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                              <BookOpen className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Ind. 4: Competências</p>
                              <p className="text-xl font-bold">{performanceData.indicadores.performanceCompetencias.toFixed(0)}%</p>
                            </div>
                          </div>
                          <Progress value={performanceData.indicadores.performanceCompetencias} className="mt-3 h-2" />
                          <p className="text-xs text-gray-400 mt-2">% conteúdos concluídos (aulas, filmes, livros, podcasts, vídeos) - ciclos finalizados</p>
                        </CardContent>
                      </Card>

                      {/* Ind 5 - Aprendizado */}
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                              <GraduationCap className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Ind. 5: Aprendizado</p>
                              <p className="text-xl font-bold">{(performanceData.indicadores.performanceAprendizado || 0).toFixed(0)}%</p>
                            </div>
                          </div>
                          <Progress value={performanceData.indicadores.performanceAprendizado || 0} className="mt-3 h-2" />
                          <p className="text-xs text-gray-400 mt-2">Notas das avaliações (filmes, vídeos, livros, podcasts, EAD) — ciclos finalizados</p>
                        </CardContent>
                      </Card>

                      {/* Ind 6 - Eventos */}
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-rose-100 flex items-center justify-center">
                              <PartyPopper className="h-5 w-5 text-rose-600" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Ind. 6: Eventos</p>
                              <p className="text-xl font-bold">{performanceData.indicadores.participacaoEventos.toFixed(0)}%</p>
                            </div>
                          </div>
                          <Progress value={performanceData.indicadores.participacaoEventos} className="mt-3 h-2" />
                          <p className="text-xs text-gray-400 mt-2">
                            {performanceData.indicadores.eventosPresente || 0} presenças de {performanceData.indicadores.totalEventos || 0} eventos
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </>
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
                          <p className="text-3xl font-bold text-[#1B3A5D]">{detalheAluno.totalCompetencias}</p>
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
                            <Route className="h-4 w-4 text-[#1B3A5D]" />
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
                          <p className="text-3xl font-bold text-[#1B3A5D]">{detalheAluno.totalEventos}</p>
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
                          <Video className="h-5 w-5 text-[#1B3A5D]" />
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
                        <Calendar className="h-5 w-5 text-[#1B3A5D]" />
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
