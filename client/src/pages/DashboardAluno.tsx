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
  ChevronUp
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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

  // Buscar plano individual do aluno
  const { data: planoIndividual = [], isLoading: loadingPlano } = trpc.planoIndividual.byAluno.useQuery(
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
                <Select 
                  value={selectedAlunoId ? String(selectedAlunoId) : ""} 
                  onValueChange={(v) => setSelectedAlunoId(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um aluno" />
                  </SelectTrigger>
                  <SelectContent>
                    {alunos.map(a => (
                      <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#1B3A5D] to-[#2D5A87] flex items-center justify-center">
                    <GraduationCap className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900">{selectedAluno?.name}</h2>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {alunoProgram && (
                        <Badge variant="outline" className="text-[#1B3A5D] border-[#1B3A5D]">
                          {alunoProgram.name}
                        </Badge>
                      )}
                      {selectedAluno?.email && (
                        <span className="text-sm text-gray-500">{selectedAluno.email}</span>
                      )}
                    </div>
                  </div>
                  {performanceData && (
                    <div className="text-center">
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
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="indicadores">Indicadores</TabsTrigger>
                <TabsTrigger value="competencias">Competências</TabsTrigger>
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
                          <p className="text-xs text-gray-400 mt-2">Média de: presença + atividades + nota mentora</p>
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
                          <p className="text-xs text-gray-400 mt-2">% aulas concluídas (ciclos finalizados)</p>
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
                          <p className="text-xs text-gray-400 mt-2">Média das notas das provas (ciclos finalizados)</p>
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

              {/* Tab Competências */}
              <TabsContent value="competencias" className="space-y-4">
                {loadingPlano ? (
                  <Card>
                    <CardContent className="py-8 text-center text-gray-500">
                      Carregando competências...
                    </CardContent>
                  </Card>
                ) : planoIndividual.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-[#1B3A5D]" />
                        Plano Individual de Competências
                      </CardTitle>
                      <CardDescription>
                        {planoIndividual.length} competências obrigatórias definidas
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {planoIndividual.map((item) => (
                          <div 
                            key={item.id} 
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
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
                            <div className="flex items-center gap-4">
                              <Badge className={getStatusColor(item.status || 'pendente')}>
                                {getStatusLabel(item.status || 'pendente')}
                              </Badge>
                              {item.notaAtual && (
                                <div className="text-right">
                                  <p className={`text-lg font-bold ${parseFloat(item.notaAtual) >= 7 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    {parseFloat(item.notaAtual).toFixed(1)}
                                  </p>
                                  <p className="text-xs text-gray-500">Nota</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center text-gray-500">
                      <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Nenhuma competência obrigatória definida para este aluno.</p>
                      <p className="text-sm mt-2">Acesse o menu "Plano Individual" para definir as competências.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Tab Histórico */}
              <TabsContent value="historico" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-[#1B3A5D]" />
                      Histórico de Participação
                    </CardTitle>
                    <CardDescription>
                      Resumo das mentorias e eventos do aluno
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {performanceData ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Mentorias */}
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            Mentorias
                          </h4>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total de sessões</span>
                              <span className="font-medium">{performanceData.indicadores.totalMentorias || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Presenças</span>
                              <span className="font-medium text-emerald-600">{performanceData.indicadores.mentoriasPresente || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Taxa de presença</span>
                              <span className="font-medium">{performanceData.indicadores.participacaoMentorias.toFixed(0)}%</span>
                            </div>
                          </div>
                        </div>

                        {/* Eventos */}
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Users className="h-4 w-4 text-rose-600" />
                            Eventos
                          </h4>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total de eventos</span>
                              <span className="font-medium">{performanceData.indicadores.totalEventos || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Participações</span>
                              <span className="font-medium text-emerald-600">{performanceData.indicadores.eventosPresente || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Taxa de participação</span>
                              <span className="font-medium">{performanceData.indicadores.participacaoEventos.toFixed(0)}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-4">
                        Selecione um aluno para ver o histórico.
                      </p>
                    )}
                  </CardContent>
                </Card>
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
