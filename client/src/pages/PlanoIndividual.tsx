import { useState, useMemo } from "react";
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
import { Search, Plus, Trash2, BookOpen, Target, CheckCircle2, Clock, AlertCircle, Users, Building2, TrendingUp, Award, BarChart3, Calendar, Edit2, ChevronRight, Circle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

  // Ciclos state
  const [isCicloDialogOpen, setIsCicloDialogOpen] = useState(false);
  const [editingCiclo, setEditingCiclo] = useState<any>(null);
  const [cicloNome, setCicloNome] = useState("");
  const [cicloDataInicio, setCicloDataInicio] = useState("");
  const [cicloDataFim, setCicloDataFim] = useState("");
  const [cicloObservacoes, setCicloObservacoes] = useState("");
  const [cicloCompetenciasSelecionadas, setCicloCompetenciasSelecionadas] = useState<number[]>([]);
  const [cicloTrilhaFiltro, setCicloTrilhaFiltro] = useState<string>("all");

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
  
  // Query de ciclos do aluno selecionado
  const { data: ciclosAluno, refetch: refetchCiclos } = trpc.ciclos.porAluno.useQuery(
    { alunoId: selectedAluno! },
    { enabled: !!selectedAluno }
  );

  // Query de performance filtrada
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

  // Ciclos mutations
  const criarCicloMutation = trpc.ciclos.criar.useMutation({
    onSuccess: () => {
      toast.success("Ciclo criado com sucesso!");
      refetchCiclos();
      resetCicloForm();
    },
    onError: (error) => {
      toast.error(`Erro ao criar ciclo: ${error.message}`);
    }
  });

  const atualizarCicloMutation = trpc.ciclos.atualizar.useMutation({
    onSuccess: () => {
      toast.success("Ciclo atualizado com sucesso!");
      refetchCiclos();
      resetCicloForm();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar ciclo: ${error.message}`);
    }
  });

  const excluirCicloMutation = trpc.ciclos.excluir.useMutation({
    onSuccess: () => {
      toast.success("Ciclo excluído com sucesso!");
      refetchCiclos();
    },
    onError: (error) => {
      toast.error(`Erro ao excluir ciclo: ${error.message}`);
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

  // Competências do plano filtradas para o dialog de ciclo
  const competenciasParaCiclo = useMemo(() => {
    if (!planoAluno) return [];
    const filtered = planoAluno.filter(p => {
      const matchesTrilha = cicloTrilhaFiltro === "all" || String(p.trilhaId) === cicloTrilhaFiltro;
      return matchesTrilha;
    });
    return filtered;
  }, [planoAluno, cicloTrilhaFiltro]);

  // Filtrar competências para atribuição em lote
  const competenciasLoteDisponiveis = competencias?.filter(comp => {
    const matchesTrilha = selectedTrilhaLote === "all" || comp.trilhaId === parseInt(selectedTrilhaLote);
    return matchesTrilha;
  }) || [];

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

  // Ciclos helpers
  const resetCicloForm = () => {
    setIsCicloDialogOpen(false);
    setEditingCiclo(null);
    setCicloNome("");
    setCicloDataInicio("");
    setCicloDataFim("");
    setCicloObservacoes("");
    setCicloCompetenciasSelecionadas([]);
    setCicloTrilhaFiltro("all");
  };

  const openEditCiclo = (ciclo: any) => {
    setEditingCiclo(ciclo);
    setCicloNome(ciclo.nomeCiclo);
    setCicloDataInicio(typeof ciclo.dataInicio === 'string' ? ciclo.dataInicio.split('T')[0] : new Date(ciclo.dataInicio).toISOString().split('T')[0]);
    setCicloDataFim(typeof ciclo.dataFim === 'string' ? ciclo.dataFim.split('T')[0] : new Date(ciclo.dataFim).toISOString().split('T')[0]);
    setCicloObservacoes(ciclo.observacoes || "");
    setCicloCompetenciasSelecionadas(ciclo.competenciaIds || []);
    setIsCicloDialogOpen(true);
  };

  const handleSaveCiclo = () => {
    if (!cicloNome || !cicloDataInicio || !cicloDataFim || cicloCompetenciasSelecionadas.length === 0) {
      toast.error("Preencha todos os campos obrigatórios e selecione pelo menos uma competência");
      return;
    }
    if (new Date(cicloDataFim) <= new Date(cicloDataInicio)) {
      toast.error("A data de fim deve ser posterior à data de início");
      return;
    }

    if (editingCiclo) {
      atualizarCicloMutation.mutate({
        cicloId: editingCiclo.id,
        nomeCiclo: cicloNome,
        dataInicio: cicloDataInicio,
        dataFim: cicloDataFim,
        competenciaIds: cicloCompetenciasSelecionadas,
        observacoes: cicloObservacoes || undefined,
      });
    } else {
      criarCicloMutation.mutate({
        alunoId: selectedAluno!,
        nomeCiclo: cicloNome,
        dataInicio: cicloDataInicio,
        dataFim: cicloDataFim,
        competenciaIds: cicloCompetenciasSelecionadas,
        observacoes: cicloObservacoes || undefined,
      });
    }
  };

  const handleExcluirCiclo = (cicloId: number, nomeCiclo: string) => {
    if (confirm(`Tem certeza que deseja excluir o ciclo "${nomeCiclo}"? Esta ação não pode ser desfeita.`)) {
      excluirCicloMutation.mutate({ cicloId });
    }
  };

  const getCicloStatus = (ciclo: any) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const inicio = new Date(ciclo.dataInicio);
    inicio.setHours(0, 0, 0, 0);
    const fim = new Date(ciclo.dataFim);
    fim.setHours(0, 0, 0, 0);

    if (hoje < inicio) return { label: "Futuro", color: "bg-slate-400", textColor: "text-slate-600", borderColor: "border-slate-300" };
    if (hoje > fim) return { label: "Finalizado", color: "bg-green-500", textColor: "text-green-700", borderColor: "border-green-300" };
    return { label: "Em Andamento", color: "bg-blue-500", textColor: "text-blue-700", borderColor: "border-blue-300" };
  };

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Plano Individual</h1>
            <p className="text-slate-600">Defina as competências obrigatórias e ciclos de execução para cada aluno</p>
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
              ) : (
                <Tabs defaultValue="competencias" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="competencias">Competências</TabsTrigger>
                    <TabsTrigger value="ciclos">
                      Ciclos de Execução
                      {ciclosAluno && ciclosAluno.length > 0 && (
                        <Badge variant="secondary" className="ml-2 text-xs">{ciclosAluno.length}</Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>

                  {/* Tab: Competências */}
                  <TabsContent value="competencias">
                    {!planoAluno || planoAluno.length === 0 ? (
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
                                      <span className="text-slate-600">&ge; {item.metaNota}</span>
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
                  </TabsContent>

                  {/* Tab: Ciclos de Execução */}
                  <TabsContent value="ciclos">
                    <div className="space-y-4">
                      {/* Header dos Ciclos */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-600">
                            Defina os ciclos de execução com períodos e competências que o aluno deve cumprir.
                          </p>
                        </div>
                        <Button
                          onClick={() => {
                            resetCicloForm();
                            setIsCicloDialogOpen(true);
                          }}
                          disabled={!planoAluno || planoAluno.length === 0}
                          className="bg-[#E87722] hover:bg-[#d06a1e]"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Novo Ciclo
                        </Button>
                      </div>

                      {(!planoAluno || planoAluno.length === 0) && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                          <AlertCircle className="w-4 h-4 inline mr-2" />
                          Adicione competências ao plano do aluno antes de criar ciclos de execução.
                        </div>
                      )}

                      {/* Lista de Ciclos */}
                      {!ciclosAluno || ciclosAluno.length === 0 ? (
                        planoAluno && planoAluno.length > 0 && (
                          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                            <Calendar className="w-12 h-12 mb-4 opacity-50" />
                            <p>Nenhum ciclo de execução definido</p>
                            <p className="text-sm">Clique em "Novo Ciclo" para definir os períodos de execução</p>
                          </div>
                        )
                      ) : (
                        <div className="space-y-4">
                          {/* Visualização do Caminho / Timeline */}
                          <div className="relative">
                            {ciclosAluno.map((ciclo, index) => {
                              const status = getCicloStatus(ciclo);
                              return (
                                <div key={ciclo.id} className="relative flex gap-4 pb-6">
                                  {/* Linha vertical conectora */}
                                  {index < ciclosAluno.length - 1 && (
                                    <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-slate-200" />
                                  )}
                                  
                                  {/* Indicador de status */}
                                  <div className="flex-shrink-0 mt-1">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${status.color} text-white`}>
                                      {status.label === "Finalizado" ? (
                                        <CheckCircle2 className="w-5 h-5" />
                                      ) : status.label === "Em Andamento" ? (
                                        <Clock className="w-5 h-5" />
                                      ) : (
                                        <Circle className="w-5 h-5" />
                                      )}
                                    </div>
                                  </div>

                                  {/* Card do Ciclo */}
                                  <div className={`flex-1 border rounded-lg p-4 ${status.borderColor} bg-white`}>
                                    <div className="flex items-start justify-between mb-3">
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <h4 className="font-semibold text-slate-800">{ciclo.nomeCiclo}</h4>
                                          <Badge className={`${status.color} text-white text-xs`}>
                                            {status.label}
                                          </Badge>
                                        </div>
                                        <p className="text-sm text-slate-500 mt-1">
                                          <Calendar className="w-3 h-3 inline mr-1" />
                                          {formatDate(ciclo.dataInicio)} até {formatDate(ciclo.dataFim)}
                                        </p>
                                        {ciclo.observacoes && (
                                          <p className="text-sm text-slate-500 mt-1 italic">{ciclo.observacoes}</p>
                                        )}
                                      </div>
                                      <div className="flex gap-1">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => openEditCiclo(ciclo)}
                                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                        >
                                          <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleExcluirCiclo(ciclo.id, ciclo.nomeCiclo)}
                                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>

                                    {/* Competências do Ciclo */}
                                    <div className="flex flex-wrap gap-2">
                                      {ciclo.competencias?.map((comp: any) => (
                                        <Badge key={comp.id} variant="outline" className="text-xs">
                                          {comp.competenciaNome}
                                          {comp.trilhaNome && (
                                            <span className="text-slate-400 ml-1">({comp.trilhaNome})</span>
                                          )}
                                        </Badge>
                                      ))}
                                    </div>

                                    {/* Info do ciclo */}
                                    <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                                      <span>{ciclo.competencias?.length || 0} competência(s)</span>
                                      {status.label === "Finalizado" && (
                                        <span className="text-green-600 font-medium">
                                          Entra no cálculo da Performance Geral
                                        </span>
                                      )}
                                      {status.label === "Em Andamento" && (
                                        <span className="text-blue-600 font-medium">
                                          Não entra na Performance Geral (ciclo em andamento)
                                        </span>
                                      )}
                                      {status.label === "Futuro" && (
                                        <span className="text-slate-400">
                                          Aguardando início
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Legenda */}
                          <div className="flex items-center gap-6 text-xs text-slate-500 pt-2 border-t">
                            <div className="flex items-center gap-1.5">
                              <div className="w-3 h-3 rounded-full bg-green-500" />
                              <span>Finalizado (entra na Performance Geral)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="w-3 h-3 rounded-full bg-blue-500" />
                              <span>Em Andamento (separado)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="w-3 h-3 rounded-full bg-slate-400" />
                              <span>Futuro (não entra no cálculo)</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Dialog para Criar/Editar Ciclo */}
        <Dialog open={isCicloDialogOpen} onOpenChange={(open) => { if (!open) resetCicloForm(); else setIsCicloDialogOpen(true); }}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCiclo ? `Editar Ciclo: ${editingCiclo.nomeCiclo}` : "Novo Ciclo de Execução"}
              </DialogTitle>
              <DialogDescription>
                Defina o período e as competências que o aluno deve cumprir neste ciclo.
                Após o período finalizar, as competências deste ciclo entrarão no cálculo da Performance Geral.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Nome do Ciclo */}
              <div>
                <label className="text-sm font-medium block mb-1">Nome do Ciclo *</label>
                <Input
                  placeholder="Ex: Ciclo 1 - Competências Comportamentais"
                  value={cicloNome}
                  onChange={(e) => setCicloNome(e.target.value)}
                />
              </div>

              {/* Datas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-1">Data de Início *</label>
                  <Input
                    type="date"
                    value={cicloDataInicio}
                    onChange={(e) => setCicloDataInicio(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Data de Fim *</label>
                  <Input
                    type="date"
                    value={cicloDataFim}
                    onChange={(e) => setCicloDataFim(e.target.value)}
                  />
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="text-sm font-medium block mb-1">Observações</label>
                <Input
                  placeholder="Observações opcionais sobre este ciclo"
                  value={cicloObservacoes}
                  onChange={(e) => setCicloObservacoes(e.target.value)}
                />
              </div>

              {/* Seleção de Competências */}
              <div>
                <label className="text-sm font-medium block mb-2">
                  Competências do Ciclo * ({cicloCompetenciasSelecionadas.length} selecionadas)
                </label>
                
                {/* Filtro por trilha */}
                <Select value={cicloTrilhaFiltro} onValueChange={setCicloTrilhaFiltro}>
                  <SelectTrigger className="mb-2">
                    <SelectValue placeholder="Filtrar por trilha" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as trilhas</SelectItem>
                    {trilhas?.map(trilha => (
                      <SelectItem key={trilha.id} value={String(trilha.id)}>{trilha.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="border rounded-lg max-h-60 overflow-y-auto p-2 space-y-1">
                  {competenciasParaCiclo.length === 0 ? (
                    <p className="text-center text-slate-500 py-4 text-sm">
                      Nenhuma competência disponível no plano do aluno
                    </p>
                  ) : (
                    competenciasParaCiclo.map(item => (
                      <div key={item.competenciaId} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded">
                        <Checkbox
                          checked={cicloCompetenciasSelecionadas.includes(item.competenciaId)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setCicloCompetenciasSelecionadas([...cicloCompetenciasSelecionadas, item.competenciaId]);
                            } else {
                              setCicloCompetenciasSelecionadas(cicloCompetenciasSelecionadas.filter(id => id !== item.competenciaId));
                            }
                          }}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.competenciaNome}</p>
                          <p className="text-xs text-slate-500">{item.trilhaNome || "Sem trilha"}</p>
                        </div>
                        {getStatusBadge(item.status)}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={resetCicloForm}>
                Cancelar
              </Button>
              <Button
                onClick={handleSaveCiclo}
                disabled={criarCicloMutation.isPending || atualizarCicloMutation.isPending || !cicloNome || !cicloDataInicio || !cicloDataFim || cicloCompetenciasSelecionadas.length === 0}
                className="bg-[#E87722] hover:bg-[#d06a1e]"
              >
                {criarCicloMutation.isPending || atualizarCicloMutation.isPending
                  ? "Salvando..."
                  : editingCiclo ? "Atualizar Ciclo" : "Criar Ciclo"
                }
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Indicadores de Performance Filtrada */}
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
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Performance Geral</span>
                  </div>
                  <p className="text-3xl font-bold text-blue-900">
                    {performanceFiltrada.indicadores.notaFinal.toFixed(1)}%
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

                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-purple-800">Média Notas</span>
                  </div>
                  <p className="text-3xl font-bold text-purple-900">
                    {performanceFiltrada.planoIndividual.mediaNotas.toFixed(1)}
                  </p>
                  <p className="text-sm text-purple-700 mt-1">Meta: &ge; 7.0</p>
                </div>

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

              <div className="space-y-4">
                <h4 className="font-semibold text-slate-700">7 Indicadores de Performance</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-slate-600">1. Participação nas Mentorias</span>
                      <span className="text-sm font-medium">{performanceFiltrada.indicadores.participacaoMentorias.toFixed(0)}%</span>
                    </div>
                    <Progress value={performanceFiltrada.indicadores.participacaoMentorias} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-slate-600">2. Atividades Práticas</span>
                      <span className="text-sm font-medium">{performanceFiltrada.indicadores.atividadesPraticas.toFixed(0)}%</span>
                    </div>
                    <Progress value={performanceFiltrada.indicadores.atividadesPraticas} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-slate-600">3. Engajamento (média base 100: presença + tarefa + nota evolução)</span>
                      <span className="text-sm font-medium">{performanceFiltrada.indicadores.engajamento.toFixed(0)}%</span>
                    </div>
                    <Progress value={performanceFiltrada.indicadores.engajamento} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-slate-600">4. Performance das Competências</span>
                      <span className="text-sm font-medium">{performanceFiltrada.indicadores.performanceCompetencias.toFixed(0)}%</span>
                    </div>
                    <Progress value={performanceFiltrada.indicadores.performanceCompetencias} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-slate-600">5. Performance de Aprendizado</span>
                      <span className="text-sm font-medium">{(performanceFiltrada.indicadores as any).performanceAprendizado?.toFixed(0) ?? performanceFiltrada.indicadores.performanceCompetencias.toFixed(0)}%</span>
                    </div>
                    <Progress value={(performanceFiltrada.indicadores as any).performanceAprendizado ?? performanceFiltrada.indicadores.performanceCompetencias} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-slate-600">6. Participação em Eventos</span>
                      <span className="text-sm font-medium">{performanceFiltrada.indicadores.participacaoEventos.toFixed(0)}%</span>
                    </div>
                    <Progress value={performanceFiltrada.indicadores.participacaoEventos} className="h-2" />
                  </div>
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
