import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { 
  GraduationCap, 
  Building2, 
  Users, 
  Search,
  Calendar,
  Loader2
} from "lucide-react";
import { useState, useMemo } from "react";

export default function Turmas() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>("all");
  
  const { data: turmas, isLoading } = trpc.turmas.listWithDetails.useQuery();
  
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
    if (!turmas) return { totalTurmas: 0, totalAlunos: 0, totalEmpresas: 0 };
    return {
      totalTurmas: turmas.length,
      totalAlunos: turmas.reduce((sum, t) => sum + t.totalAlunos, 0),
      totalEmpresas: empresas.length,
    };
  }, [turmas, empresas]);

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
            Visualize todas as turmas cadastradas e suas respectivas empresas
          </p>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="gradient-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Turmas</p>
                  <p className="text-3xl font-bold text-foreground">{stats.totalTurmas}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="gradient-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Alunos</p>
                  <p className="text-3xl font-bold text-foreground">{stats.totalAlunos}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="gradient-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Empresas</p>
                  <p className="text-3xl font-bold text-foreground">{stats.totalEmpresas}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-chart-3/10 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-chart-3" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="gradient-card">
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar turma ou empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
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
    </DashboardLayout>
  );
}
