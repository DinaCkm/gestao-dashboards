import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Search, Plus, Trash2, BookOpen, Target, CheckCircle2, Clock, AlertCircle, Users, Building2, TrendingUp, Award, BarChart3 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function PlanoIndividual() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>("all");
  const [selectedAluno, setSelectedAluno] = useState<number | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCompetencias, setSelectedCompetencias] = useState<number[]>([]);
  const [selectedTrilha, setSelectedTrilha] = useState<string>("all");

  // Queries
  const { data: alunosWithPlano, isLoading: loadingAlunos, refetch: refetchAlunos } = trpc.planoIndividual.alunosWithPlano.useQuery();
  const { data: empresas } = trpc.indicadores.empresas.useQuery();
  const { data: planoAluno, refetch: refetchPlano } = trpc.planoIndividual.byAluno.useQuery(
    { alunoId: selectedAluno! },
    { enabled: !!selectedAluno }
  );
  const { data: competencias } = trpc.competencias.listWithTrilha.useQuery();
  const { data: trilhas } = trpc.trilhas.list.useQuery();
  
  // Query de performance filtrada (BLOCO 3)
  const { data: performanceFiltrada } = trpc.indicadores.performanceFiltrada.useQuery(
    { alunoId: selectedAluno! },
    { enabled: !!selectedAluno }
  );

  // Mutations
  const addMultipleMutation = trpc.planoIndividual.addMultiple.useMutation({
    onSuccess: () => {
      toast.success("Competências adicionadas ao plano!");
      refetchPlano();
      refetchAlunos();
      setIsAddDialogOpen(false);
      setSelectedCompetencias([]);
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    }
  });

  const removeMutation = trpc.planoIndividual.remove.useMutation({
    onSuccess: () => {
      toast.success("Competência removida do plano!");
      refetchPlano();
      refetchAlunos();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    }
  });

  const updateMutation = trpc.planoIndividual.update.useMutation({
    onSuccess: () => {
      toast.success("Plano atualizado!");
      refetchPlano();
      refetchAlunos();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    }
  });

  // Filtrar alunos
  const filteredAlunos = alunosWithPlano?.filter(aluno => {
    const matchesSearch = aluno.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         aluno.externalId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEmpresa = selectedEmpresa === "all" || aluno.programId === parseInt(selectedEmpresa);
    return matchesSearch && matchesEmpresa;
  }) || [];

  // Filtrar competências disponíveis (não no plano atual)
  const competenciasDisponiveis = competencias?.filter(comp => {
    const jaNoPlano = planoAluno?.some(p => p.competenciaId === comp.id);
    const matchesTrilha = selectedTrilha === "all" || comp.trilhaId === parseInt(selectedTrilha);
    return !jaNoPlano && matchesTrilha;
  }) || [];

  // Agrupar plano por trilha
  const planoAgrupado = planoAluno?.reduce((acc, item) => {
    const trilha = item.trilhaNome || "Sem Trilha";
    if (!acc[trilha]) acc[trilha] = [];
    acc[trilha].push(item);
    return acc;
  }, {} as Record<string, typeof planoAluno>) || {};

  const handleAddCompetencias = () => {
    if (!selectedAluno || selectedCompetencias.length === 0) return;
    addMultipleMutation.mutate({
      alunoId: selectedAluno,
      competenciaIds: selectedCompetencias
    });
  };

  const handleRemove = (id: number) => {
    if (confirm("Remover esta competência do plano?")) {
      removeMutation.mutate({ id });
    }
  };

  const handleToggleStatus = (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "concluida" ? "pendente" : "concluida";
    updateMutation.mutate({ id, status: newStatus as "pendente" | "em_progresso" | "concluida" });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "concluida":
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Concluída</Badge>;
      case "em_progresso":
        return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" /> Em Progresso</Badge>;
      default:
        return <Badge variant="outline"><AlertCircle className="w-3 h-3 mr-1" /> Pendente</Badge>;
    }
  };

  const selectedAlunoData = alunosWithPlano?.find(a => a.id === selectedAluno);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Plano Individual</h1>
            <p className="text-slate-600">Defina as competências obrigatórias para cada aluno</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Total de Alunos</p>
                  <p className="text-2xl font-bold">{alunosWithPlano?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Com Plano Definido</p>
                  <p className="text-2xl font-bold">
                    {alunosWithPlano?.filter(a => a.totalCompetencias > 0).length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <BookOpen className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Total Competências</p>
                  <p className="text-2xl font-bold">{competencias?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Building2 className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Empresas</p>
                  <p className="text-2xl font-bold">{empresas?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Alunos */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Alunos</CardTitle>
              <CardDescription>Selecione um aluno para gerenciar seu plano</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtros */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Buscar aluno..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedEmpresa} onValueChange={setSelectedEmpresa}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as empresas</SelectItem>
                    {empresas?.map(emp => (
                      <SelectItem key={emp.id} value={String(emp.id)}>{emp.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Lista */}
              <div className="max-h-[500px] overflow-y-auto space-y-2">
                {loadingAlunos ? (
                  <p className="text-center text-slate-500 py-4">Carregando...</p>
                ) : filteredAlunos.length === 0 ? (
                  <p className="text-center text-slate-500 py-4">Nenhum aluno encontrado</p>
                ) : (
                  filteredAlunos.map(aluno => (
                    <div
                      key={aluno.id}
                      onClick={() => setSelectedAluno(aluno.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedAluno === aluno.id
                          ? "bg-blue-50 border-blue-300"
                          : "hover:bg-slate-50 border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-800">{aluno.name}</p>
                          <p className="text-sm text-slate-500">ID: {aluno.externalId}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={aluno.totalCompetencias > 0 ? "default" : "outline"}>
                            {aluno.competenciasObrigatorias} obrig.
                          </Badge>
                          {aluno.progressoPlano > 0 && (
                            <p className="text-xs text-green-600 mt-1">
                              {aluno.progressoPlano}% concluído
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Plano do Aluno Selecionado */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {selectedAlunoData ? `Plano de ${selectedAlunoData.name}` : "Selecione um Aluno"}
                  </CardTitle>
                  <CardDescription>
                    {selectedAlunoData
                      ? `${selectedAlunoData.competenciasObrigatorias} competências obrigatórias • ${selectedAlunoData.competenciasConcluidas} concluídas`
                      : "Clique em um aluno para ver e editar seu plano individual"
                    }
                  </CardDescription>
                </div>
                {selectedAluno && (
                  <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Competências
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Adicionar Competências ao Plano</DialogTitle>
                        <DialogDescription>
                          Selecione as competências obrigatórias para {selectedAlunoData?.name}
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4">
                        <Select value={selectedTrilha} onValueChange={setSelectedTrilha}>
                          <SelectTrigger>
                            <SelectValue placeholder="Filtrar por trilha" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todas as trilhas</SelectItem>
                            {trilhas?.map(trilha => (
                              <SelectItem key={trilha.id} value={String(trilha.id)}>{trilha.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                          {competenciasDisponiveis.length === 0 ? (
                            <p className="text-center text-slate-500 py-4">
                              Todas as competências já estão no plano
                            </p>
                          ) : (
                            competenciasDisponiveis.map(comp => (
                              <div
                                key={comp.id}
                                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50"
                              >
                                <Checkbox
                                  checked={selectedCompetencias.includes(comp.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedCompetencias([...selectedCompetencias, comp.id]);
                                    } else {
                                      setSelectedCompetencias(selectedCompetencias.filter(id => id !== comp.id));
                                    }
                                  }}
                                />
                                <div className="flex-1">
                                  <p className="font-medium">{comp.nome}</p>
                                  <p className="text-sm text-slate-500">{comp.trilhaNome}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button
                          onClick={handleAddCompetencias}
                          disabled={selectedCompetencias.length === 0 || addMultipleMutation.isPending}
                        >
                          {addMultipleMutation.isPending ? "Adicionando..." : `Adicionar ${selectedCompetencias.length} competência(s)`}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!selectedAluno ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <Target className="w-12 h-12 mb-4 opacity-50" />
                  <p>Selecione um aluno na lista ao lado</p>
                </div>
              ) : !planoAluno || planoAluno.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <BookOpen className="w-12 h-12 mb-4 opacity-50" />
                  <p>Nenhuma competência definida</p>
                  <p className="text-sm">Clique em "Adicionar Competências" para começar</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(planoAgrupado).map(([trilha, items]) => (
                    <div key={trilha}>
                      <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        {trilha}
                        <Badge variant="outline" className="ml-2">{items?.length || 0}</Badge>
                      </h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Competência</TableHead>
                            <TableHead className="w-32">Status</TableHead>
                            <TableHead className="w-24">Meta</TableHead>
                            <TableHead className="w-24">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items?.map(item => (
                            <TableRow key={item.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{item.competenciaNome}</p>
                                  {item.competenciaCodigo && (
                                    <p className="text-xs text-slate-500">{item.competenciaCodigo}</p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <button onClick={() => handleToggleStatus(item.id, item.status)}>
                                  {getStatusBadge(item.status)}
                                </button>
                              </TableCell>
                              <TableCell>
                                <span className="text-slate-600">≥ {item.metaNota}</span>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemove(item.id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Indicadores de Performance Filtrada - BLOCO 3 */}
        {selectedAluno && performanceFiltrada && planoAluno && planoAluno.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Performance Filtrada
              </CardTitle>
              <CardDescription>
                Indicadores calculados apenas com as competências obrigatórias do plano individual
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Nota Final */}
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Nota Final</span>
                  </div>
                  <p className="text-3xl font-bold text-blue-900">
                    {performanceFiltrada.indicadores.notaFinal.toFixed(1)}
                  </p>
                  <Badge className={`mt-2 ${
                    performanceFiltrada.indicadores.classificacao === 'Excelência' ? 'bg-green-500' :
                    performanceFiltrada.indicadores.classificacao === 'Avançado' ? 'bg-blue-500' :
                    performanceFiltrada.indicadores.classificacao === 'Intermediário' ? 'bg-yellow-500' :
                    performanceFiltrada.indicadores.classificacao === 'Básico' ? 'bg-orange-500' : 'bg-red-500'
                  }`}>
                    {performanceFiltrada.indicadores.classificacao}
                  </Badge>
                </div>

                {/* Competências Aprovadas */}
                <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Competências</span>
                  </div>
                  <p className="text-3xl font-bold text-green-900">
                    {performanceFiltrada.planoIndividual.competenciasAprovadas}/{performanceFiltrada.planoIndividual.totalCompetencias}
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    {performanceFiltrada.planoIndividual.percentualAprovacao.toFixed(0)}% aprovadas
                  </p>
                </div>

                {/* Média das Notas */}
                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-purple-800">Média Notas</span>
                  </div>
                  <p className="text-3xl font-bold text-purple-900">
                    {performanceFiltrada.planoIndividual.mediaNotas.toFixed(1)}
                  </p>
                  <p className="text-sm text-purple-700 mt-1">Meta: ≥ 7.0</p>
                </div>

                {/* Participação Mentorias */}
                <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-orange-600" />
                    <span className="text-sm font-medium text-orange-800">Mentorias</span>
                  </div>
                  <p className="text-3xl font-bold text-orange-900">
                    {performanceFiltrada.indicadores.participacaoMentorias.toFixed(0)}%
                  </p>
                  <p className="text-sm text-orange-700 mt-1">
                    {performanceFiltrada.indicadores.mentoriasPresente}/{performanceFiltrada.indicadores.totalMentorias} presenças
                  </p>
                </div>
              </div>

              {/* Barra de Progresso dos 5 Indicadores */}
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-700">Detalhamento dos 5 Indicadores (20% cada)</h4>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-slate-600">Participação Mentorias</span>
                      <span className="text-sm font-medium">{performanceFiltrada.indicadores.participacaoMentorias.toFixed(0)}%</span>
                    </div>
                    <Progress value={performanceFiltrada.indicadores.participacaoMentorias} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-slate-600">Atividades Práticas</span>
                      <span className="text-sm font-medium">{performanceFiltrada.indicadores.atividadesPraticas.toFixed(0)}%</span>
                    </div>
                    <Progress value={performanceFiltrada.indicadores.atividadesPraticas} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-slate-600">Engajamento</span>
                      <span className="text-sm font-medium">{performanceFiltrada.indicadores.engajamento.toFixed(0)}%</span>
                    </div>
                    <Progress value={performanceFiltrada.indicadores.engajamento} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-slate-600">Performance Competências (Filtrada)</span>
                      <span className="text-sm font-medium text-blue-600 font-bold">{performanceFiltrada.indicadores.performanceCompetencias.toFixed(0)}%</span>
                    </div>
                    <Progress value={performanceFiltrada.indicadores.performanceCompetencias} className="h-2 bg-blue-100" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-slate-600">Participação Eventos</span>
                      <span className="text-sm font-medium">{performanceFiltrada.indicadores.participacaoEventos.toFixed(0)}%</span>
                    </div>
                    <Progress value={performanceFiltrada.indicadores.participacaoEventos} className="h-2" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
