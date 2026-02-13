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
  const [isLoteDialogOpen, setIsLoteDialogOpen] = useState(false);
  const [selectedTurma, setSelectedTurma] = useState<string>("");
  const [selectedCompetenciasLote, setSelectedCompetenciasLote] = useState<number[]>([]);
  const [selectedTrilhaLote, setSelectedTrilhaLote] = useState<string>("all");

  // Queries
  const { data: alunosWithPlano, isLoading: loadingAlunos, refetch: refetchAlunos } = trpc.planoIndividual.alunosWithPlano.useQuery();
  const { data: empresas } = trpc.indicadores.empresas.useQuery();
  const { data: planoAluno, refetch: refetchPlano } = trpc.planoIndividual.byAluno.useQuery(
    { alunoId: selectedAluno! },
    { enabled: !!selectedAluno }
  );
  const { data: competencias } = trpc.competencias.listWithTrilha.useQuery();
  const { data: trilhas } = trpc.trilhas.list.useQuery();
  const { data: turmas } = trpc.turmas.list.useQuery();
  
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

  const addToTurmaMutation = trpc.planoIndividual.addToTurma.useMutation({
    onSuccess: (data) => {
      toast.success(`Competências atribuídas a ${data.alunosAtualizados} de ${data.totalAlunos} alunos!`);
      refetchAlunos();
      setIsLoteDialogOpen(false);
      setSelectedCompetenciasLote([]);
      setSelectedTurma("");
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

  // Filtrar competências para atribuição em lote
  const competenciasLoteDisponiveis = competencias?.filter(comp => {
    const matchesTrilha = selectedTrilhaLote === "all" || comp.trilhaId === parseInt(selectedTrilhaLote);
    return matchesTrilha;
  }) || [];

  const handleAddToTurma = () => {
    if (!selectedTurma || selectedCompetenciasLote.length === 0) {
      toast.error("Selecione uma turma e pelo menos uma competência");
      return;
    }
    addToTurmaMutation.mutate({
      turmaId: parseInt(selectedTurma),
      competenciaIds: selectedCompetenciasLote
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Plano Individual</h1>
            <p className="text-slate-600">Defina as competências obrigatórias para cada aluno</p>
          </div>
          <Dialog open={isLoteDialogOpen} onOpenChange={setIsLoteDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#E87722] hover:bg-[#d06a1e]">
                <Users className="w-4 h-4 mr-2" />
                Atribuir em Lote
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Atribuir Competências em Lote</DialogTitle>
                <DialogDescription>
                  Selecione uma turma e as competências para atribuir a todos os alunos da turma
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium">Turma</label>
                  <Select value={selectedTurma} onValueChange={setSelectedTurma}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma turma" />
                    </SelectTrigger>
                    <SelectContent>
                      {turmas?.map(turma => (
                        <SelectItem key={turma.id} value={String(turma.id)}>
                          {turma.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Filtrar por Trilha</label>
                  <Select value={selectedTrilhaLote} onValueChange={setSelectedTrilhaLote}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as trilhas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as trilhas</SelectItem>
                      {trilhas?.map(trilha => (
                        <SelectItem key={trilha.id} value={String(trilha.id)}>
                          {trilha.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Competências ({selectedCompetenciasLote.length} selecionadas)
                  </label>
                  <div className="border rounded-lg max-h-60 overflow-y-auto p-2 space-y-1">
                    {competenciasLoteDisponiveis.map(comp => (
                      <div key={comp.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded">
                        <Checkbox
                          checked={selectedCompetenciasLote.includes(comp.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedCompetenciasLote([...selectedCompetenciasLote, comp.id]);
                            } else {
                              setSelectedCompetenciasLote(selectedCompetenciasLote.filter(id => id !== comp.id));
                            }
                          }}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{comp.nome}</p>
                          <p className="text-xs text-slate-500">{comp.trilhaNome}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsLoteDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleAddToTurma}
                  disabled={addToTurmaMutation.isPending || !selectedTurma || selectedCompetenciasLote.length === 0}
                  className="bg-[#E87722] hover:bg-[#d06a1e]"
                >
                  {addToTurmaMutation.isPending ? "Atribuindo..." : "Atribuir Competências"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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

              {/* Barra de Progresso dos 7 Indicadores (6 individuais + Performance Geral) */}
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-700">7 Indicadores de Performance</h4>
                
                <div className="space-y-3">
                  {/* Indicador 1 */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-slate-600">1. Participação nas Mentorias</span>
                      <span className="text-sm font-medium">{performanceFiltrada.indicadores.participacaoMentorias.toFixed(0)}%</span>
                    </div>
                    <Progress value={performanceFiltrada.indicadores.participacaoMentorias} className="h-2" />
                  </div>
                  
                  {/* Indicador 2 */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-slate-600">2. Atividades Práticas</span>
                      <span className="text-sm font-medium">{performanceFiltrada.indicadores.atividadesPraticas.toFixed(0)}%</span>
                    </div>
                    <Progress value={performanceFiltrada.indicadores.atividadesPraticas} className="h-2" />
                  </div>
                  
                  {/* Indicador 3 */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-slate-600">3. Evolução / Engajamento</span>
                      <span className="text-sm font-medium">{performanceFiltrada.indicadores.engajamento.toFixed(0)}%</span>
                    </div>
                    <Progress value={performanceFiltrada.indicadores.engajamento} className="h-2" />
                  </div>
                  
                  {/* Indicador 4 */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-slate-600">4. Performance das Competências</span>
                      <span className="text-sm font-medium text-blue-600 font-bold">{performanceFiltrada.indicadores.performanceCompetencias.toFixed(0)}%</span>
                    </div>
                    <Progress value={performanceFiltrada.indicadores.performanceCompetencias} className="h-2 bg-blue-100" />
                  </div>
                  
                  {/* Indicador 5 */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-slate-600">5. Performance de Aprendizado</span>
                      <span className="text-sm font-medium">{(performanceFiltrada.indicadores as any).performanceAprendizado?.toFixed(0) ?? performanceFiltrada.indicadores.performanceCompetencias.toFixed(0)}%</span>
                    </div>
                    <Progress value={(performanceFiltrada.indicadores as any).performanceAprendizado ?? performanceFiltrada.indicadores.performanceCompetencias} className="h-2" />
                  </div>
                  
                  {/* Indicador 6 */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-slate-600">6. Participação em Eventos</span>
                      <span className="text-sm font-medium">{performanceFiltrada.indicadores.participacaoEventos.toFixed(0)}%</span>
                    </div>
                    <Progress value={performanceFiltrada.indicadores.participacaoEventos} className="h-2" />
                  </div>

                  {/* Indicador 7 - Performance Geral */}
                  <div className="pt-3 border-t">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-semibold text-slate-800">7. Performance Geral (Média dos 6)</span>
                      <span className="text-sm font-bold text-primary">{performanceFiltrada.indicadores.notaFinal.toFixed(1)}%</span>
                    </div>
                    <Progress value={performanceFiltrada.indicadores.notaFinal} className="h-3" />
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
