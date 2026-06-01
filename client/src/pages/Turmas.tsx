import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { 
  GraduationCap, 
  Building2, 
  Users, 
  Search,
  Calendar,
  Loader2,
  Snowflake,
  Lock,
  Unlock,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export default function Turmas() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>("all");

  // Dialog de congelamento
  const [congelarDialog, setCongelarDialog] = useState<{ open: boolean; turmaId: number; turmaNome: string; dataAtual: string | null }>({
    open: false, turmaId: 0, turmaNome: "", dataAtual: null,
  });
  const [dataCongelamentoInput, setDataCongelamentoInput] = useState("");

  const utils = trpc.useUtils();
  const { data: turmas, isLoading } = trpc.turmas.listWithDetails.useQuery();
  const setCongelamento = trpc.turmas.setCongelamento.useMutation({
    onSuccess: () => {
      utils.turmas.listWithDetails.invalidate();
      setCongelarDialog({ open: false, turmaId: 0, turmaNome: "", dataAtual: null });
      toast.success("Configuração de congelamento salva com sucesso.");
    },
    onError: (err) => {
      toast.error("Erro ao salvar: " + err.message);
    },
  });

  // Extrair empresas únicas para o filtro
  const empresas = useMemo(() => {
    if (!turmas) return [];
    const uniqueEmpresas = Array.from(new Set(turmas.map(t => t.programName)));
    return uniqueEmpresas.sort();
  }, [turmas]);
  
  // Filtrar turmas
  const filteredTurmas = useMemo(() => {
    if (!turmas) return [];
    return turmas.filter(turma => {
      const matchesSearch = turma.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           turma.programName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesEmpresa = selectedEmpresa === "all" || turma.programName === selectedEmpresa;
      return matchesSearch && matchesEmpresa;
    });
  }, [turmas, searchTerm, selectedEmpresa]);
  
  // Agrupar por empresa
  const turmasByEmpresa = useMemo(() => {
    const grouped: Record<string, typeof filteredTurmas> = {};
    filteredTurmas.forEach(turma => {
      if (!grouped[turma.programName]) {
        grouped[turma.programName] = [];
      }
      grouped[turma.programName].push(turma);
    });
    return grouped;
  }, [filteredTurmas]);
  
  // Estatísticas
  const stats = useMemo(() => {
    if (!turmas) return { totalTurmas: 0, totalAlunos: 0, totalEmpresas: 0, totalCongeladas: 0 };
    return {
      totalTurmas: turmas.length,
      totalAlunos: turmas.reduce((sum, t) => sum + t.totalAlunos, 0),
      totalEmpresas: empresas.length,
      totalCongeladas: turmas.filter(t => t.dataCongelamento).length,
    };
  }, [turmas, empresas]);

  function formatDate(dateStr: string | null | any) {
    if (!dateStr) return null;
    // Se for objeto Date ou string ISO com timestamp (ex: "Sun May 31 2026 00:00:00...")
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const day = String(d.getUTCDate()).padStart(2, '0');
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const year = d.getUTCFullYear();
      return `${day}/${month}/${year}`;
    }
    // Fallback: string no formato YYYY-MM-DD
    const parts = String(dateStr).split('-');
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : String(dateStr);
  }

  function abrirDialogCongelar(turma: { id: number; name: string; dataCongelamento: string | null }) {
    setDataCongelamentoInput(turma.dataCongelamento || "");
    setCongelarDialog({ open: true, turmaId: turma.id, turmaNome: turma.name, dataAtual: turma.dataCongelamento });
  }

  function salvarCongelamento() {
    setCongelamento.mutate({
      turmaId: congelarDialog.turmaId,
      dataCongelamento: dataCongelamentoInput.trim() || null,
    });
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">
            <span className="text-foreground">Turmas por </span>
            <span className="text-secondary">Empresa</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Visualize todas as turmas cadastradas e gerencie o congelamento de indicadores
          </p>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="gradient-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Turmas</p>
                  <p className="text-2xl font-bold">{stats.totalTurmas}</p>
                </div>
                <GraduationCap className="h-8 w-8 text-primary/40" />
              </div>
            </CardContent>
          </Card>
          <Card className="gradient-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Alunos</p>
                  <p className="text-2xl font-bold">{stats.totalAlunos}</p>
                </div>
                <Users className="h-8 w-8 text-primary/40" />
              </div>
            </CardContent>
          </Card>
          <Card className="gradient-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Empresas</p>
                  <p className="text-2xl font-bold">{stats.totalEmpresas}</p>
                </div>
                <Building2 className="h-8 w-8 text-primary/40" />
              </div>
            </CardContent>
          </Card>
          <Card className="gradient-card border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Turmas Congeladas</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalCongeladas}</p>
                </div>
                <Snowflake className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="gradient-card">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar turma ou empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedEmpresa("all")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedEmpresa === "all"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  Todas
                </button>
                {empresas.map(empresa => (
                  <button
                    key={empresa}
                    onClick={() => setSelectedEmpresa(empresa)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedEmpresa === empresa
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {empresa}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Turmas por Empresa */}
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Carregando turmas...</span>
          </div>
        ) : Object.keys(turmasByEmpresa).length === 0 ? (
          <Card className="gradient-card">
            <CardContent className="py-12 text-center">
              <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Nenhuma turma encontrada.</p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(turmasByEmpresa).map(([empresa, turmasEmpresa]) => (
            <Card key={empresa} className="gradient-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{empresa}</CardTitle>
                    <CardDescription>
                      {turmasEmpresa.length} turma{turmasEmpresa.length !== 1 ? 's' : ''} • {' '}
                      {turmasEmpresa.reduce((sum, t) => sum + t.totalAlunos, 0)} alunos
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 text-sm font-medium">Turma</th>
                        <th className="text-left p-3 text-sm font-medium hidden sm:table-cell">Código</th>
                        <th className="text-center p-3 text-sm font-medium">Ano</th>
                        <th className="text-center p-3 text-sm font-medium">Alunos</th>
                        <th className="text-center p-3 text-sm font-medium">Status</th>
                        <th className="text-center p-3 text-sm font-medium">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {turmasEmpresa.map((turma, index) => (
                        <tr 
                          key={turma.id} 
                          className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}
                        >
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <GraduationCap className="h-4 w-4 text-secondary shrink-0" />
                              <span className="font-medium">{turma.name}</span>
                            </div>
                          </td>
                          <td className="p-3 hidden sm:table-cell">
                            <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                              {turma.externalId || '-'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{turma.year}</span>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-medium ${
                              turma.totalAlunos > 0 
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              <Users className="h-3.5 w-3.5" />
                              {turma.totalAlunos}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            {turma.dataCongelamento ? (
                              <Badge className="bg-blue-100 text-blue-700 border-blue-300 gap-1">
                                <Snowflake className="h-3 w-3" />
                                Congelado em {formatDate(turma.dataCongelamento)}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">
                                Ativo
                              </Badge>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => abrirDialogCongelar(turma)}
                              className={turma.dataCongelamento ? "text-blue-600 border-blue-300 hover:bg-blue-50" : ""}
                            >
                              {turma.dataCongelamento ? (
                                <><Unlock className="h-3.5 w-3.5 mr-1" />Editar</>
                              ) : (
                                <><Lock className="h-3.5 w-3.5 mr-1" />Congelar</>
                              )}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog de Congelamento */}
      <Dialog open={congelarDialog.open} onOpenChange={(open) => setCongelarDialog(d => ({ ...d, open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Snowflake className="h-5 w-5 text-blue-500" />
              Congelar Indicadores — {congelarDialog.turmaNome}
            </DialogTitle>
            <DialogDescription>
              Defina a data de congelamento dos indicadores desta turma. Atividades realizadas após essa data não serão contabilizadas. Deixe em branco para remover o congelamento.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="dataCongelamento">Data de Congelamento</Label>
              <Input
                id="dataCongelamento"
                type="date"
                value={dataCongelamentoInput}
                onChange={(e) => setDataCongelamentoInput(e.target.value)}
                placeholder="YYYY-MM-DD"
              />
              <p className="text-xs text-muted-foreground">
                Deixe em branco para <strong>remover o congelamento</strong> e retornar ao modo normal.
              </p>
            </div>
            {congelarDialog.dataAtual && (
              <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 rounded-lg p-3">
                <Snowflake className="h-4 w-4 shrink-0" />
                <span>Atualmente congelado em <strong>{formatDate(congelarDialog.dataAtual)}</strong></span>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCongelarDialog(d => ({ ...d, open: false }))}>
              Cancelar
            </Button>
            {congelarDialog.dataAtual && (
              <Button
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50"
                onClick={() => {
                  setDataCongelamentoInput("");
                  setCongelamento.mutate({ turmaId: congelarDialog.turmaId, dataCongelamento: null });
                }}
                disabled={setCongelamento.isPending}
              >
                <Unlock className="h-4 w-4 mr-1" />
                Remover Congelamento
              </Button>
            )}
            <Button onClick={salvarCongelamento} disabled={setCongelamento.isPending}>
              {setCongelamento.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Lock className="h-4 w-4 mr-1" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
