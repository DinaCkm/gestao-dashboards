import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Plus, Pencil, Trash2, BookOpen, Target, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function TrilhasCompetencias() {
  const [activeTab, setActiveTab] = useState("trilhas");
  const [selectedTrilha, setSelectedTrilha] = useState<number | null>(null);
  
  // Dialogs
  const [showNewTrilha, setShowNewTrilha] = useState(false);
  const [showNewCompetencia, setShowNewCompetencia] = useState(false);
  const [editingTrilha, setEditingTrilha] = useState<any>(null);
  const [editingCompetencia, setEditingCompetencia] = useState<any>(null);
  
  // Form states
  const [trilhaForm, setTrilhaForm] = useState({ name: "", codigo: "", ordem: 0 });
  const [competenciaForm, setCompetenciaForm] = useState({ nome: "", trilhaId: 0, codigoIntegracao: "", descricao: "", ordem: 0 });
  
  // Queries
  const { data: trilhas, isLoading: loadingTrilhas, refetch: refetchTrilhas } = trpc.trilhas.list.useQuery();
  const { data: competencias, isLoading: loadingCompetencias, refetch: refetchCompetencias } = trpc.competencias.listWithTrilha.useQuery();
  
  // Mutations
  const createTrilha = trpc.trilhas.create.useMutation({
    onSuccess: () => {
      toast.success("Trilha criada com sucesso!");
      refetchTrilhas();
      setShowNewTrilha(false);
      setTrilhaForm({ name: "", codigo: "", ordem: 0 });
    },
    onError: (err) => toast.error(err.message)
  });
  
  const updateTrilha = trpc.trilhas.update.useMutation({
    onSuccess: () => {
      toast.success("Trilha atualizada!");
      refetchTrilhas();
      setEditingTrilha(null);
    },
    onError: (err) => toast.error(err.message)
  });
  
  const deleteTrilha = trpc.trilhas.delete.useMutation({
    onSuccess: () => {
      toast.success("Trilha excluída!");
      refetchTrilhas();
    },
    onError: (err) => toast.error(err.message)
  });
  
  const createCompetencia = trpc.competencias.create.useMutation({
    onSuccess: () => {
      toast.success("Competência criada com sucesso!");
      refetchCompetencias();
      setShowNewCompetencia(false);
      setCompetenciaForm({ nome: "", trilhaId: 0, codigoIntegracao: "", descricao: "", ordem: 0 });
    },
    onError: (err) => toast.error(err.message)
  });
  
  const updateCompetencia = trpc.competencias.update.useMutation({
    onSuccess: () => {
      toast.success("Competência atualizada!");
      refetchCompetencias();
      setEditingCompetencia(null);
    },
    onError: (err) => toast.error(err.message)
  });
  
  const deleteCompetencia = trpc.competencias.delete.useMutation({
    onSuccess: () => {
      toast.success("Competência excluída!");
      refetchCompetencias();
    },
    onError: (err) => toast.error(err.message)
  });
  
  // Filtrar competências por trilha selecionada
  const filteredCompetencias = selectedTrilha 
    ? competencias?.filter(c => c.trilhaId === selectedTrilha)
    : competencias;
  
  // Contagem de competências por trilha
  const getCompetenciasCount = (trilhaId: number) => {
    return competencias?.filter(c => c.trilhaId === trilhaId).length || 0;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Trilhas e Competências</h1>
            <p className="text-muted-foreground">Gerencie o catálogo de trilhas e competências do programa</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowNewTrilha(true)} variant="outline">
              <BookOpen className="h-4 w-4 mr-2" />
              Nova Trilha
            </Button>
            <Button onClick={() => setShowNewCompetencia(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Competência
            </Button>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total de Trilhas</CardDescription>
              <CardTitle className="text-3xl">{trilhas?.length || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total de Competências</CardDescription>
              <CardTitle className="text-3xl">{competencias?.length || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Básicas</CardDescription>
              <CardTitle className="text-3xl">{getCompetenciasCount(1)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Essenciais</CardDescription>
              <CardTitle className="text-3xl">{getCompetenciasCount(2)}</CardTitle>
            </CardHeader>
          </Card>
        </div>
        
        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="trilhas">
              <BookOpen className="h-4 w-4 mr-2" />
              Trilhas
            </TabsTrigger>
            <TabsTrigger value="competencias">
              <Target className="h-4 w-4 mr-2" />
              Competências
            </TabsTrigger>
          </TabsList>
          
          {/* Trilhas Tab */}
          <TabsContent value="trilhas" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Trilhas de Desenvolvimento</CardTitle>
                <CardDescription>Categorias principais de competências</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingTrilhas ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ordem</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead>Competências</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trilhas?.map((trilha) => (
                        <TableRow key={trilha.id}>
                          <TableCell>{trilha.ordem}</TableCell>
                          <TableCell className="font-medium">{trilha.name}</TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">{trilha.codigo}</code>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{getCompetenciasCount(trilha.id)} competências</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={trilha.isActive ? "default" : "outline"}>
                              {trilha.isActive ? "Ativa" : "Inativa"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedTrilha(trilha.id);
                                setActiveTab("competencias");
                              }}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setEditingTrilha(trilha);
                                setTrilhaForm({ name: trilha.name, codigo: trilha.codigo || "", ordem: trilha.ordem || 0 });
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                if (confirm("Tem certeza que deseja excluir esta trilha?")) {
                                  deleteTrilha.mutate({ id: trilha.id });
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Competências Tab */}
          <TabsContent value="competencias" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Competências</CardTitle>
                    <CardDescription>
                      {selectedTrilha 
                        ? `Mostrando competências da trilha selecionada`
                        : "Todas as competências do catálogo"
                      }
                    </CardDescription>
                  </div>
                  <Select 
                    value={selectedTrilha?.toString() || "all"} 
                    onValueChange={(v) => setSelectedTrilha(v === "all" ? null : parseInt(v))}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filtrar por trilha" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as trilhas</SelectItem>
                      {trilhas?.map((t) => (
                        <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {loadingCompetencias ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ordem</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Trilha</TableHead>
                        <TableHead>Código Integração</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCompetencias?.map((comp) => (
                        <TableRow key={comp.id}>
                          <TableCell>{comp.ordem}</TableCell>
                          <TableCell className="font-medium">{comp.nome}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{comp.trilhaNome}</Badge>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">{comp.codigoIntegracao}</code>
                          </TableCell>
                          <TableCell>
                            <Badge variant={comp.isActive ? "default" : "outline"}>
                              {comp.isActive ? "Ativa" : "Inativa"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setEditingCompetencia(comp);
                                setCompetenciaForm({
                                  nome: comp.nome,
                                  trilhaId: comp.trilhaId,
                                  codigoIntegracao: comp.codigoIntegracao || "",
                                  descricao: comp.descricao || "",
                                  ordem: comp.ordem || 0
                                });
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                if (confirm("Tem certeza que deseja excluir esta competência?")) {
                                  deleteCompetencia.mutate({ id: comp.id });
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Dialog: Nova Trilha */}
        <Dialog open={showNewTrilha} onOpenChange={setShowNewTrilha}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Trilha</DialogTitle>
              <DialogDescription>Adicione uma nova trilha de desenvolvimento ao catálogo</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome da Trilha</Label>
                <Input 
                  value={trilhaForm.name}
                  onChange={(e) => setTrilhaForm({...trilhaForm, name: e.target.value})}
                  placeholder="Ex: Básicas"
                />
              </div>
              <div>
                <Label>Código</Label>
                <Input 
                  value={trilhaForm.codigo}
                  onChange={(e) => setTrilhaForm({...trilhaForm, codigo: e.target.value.toUpperCase()})}
                  placeholder="Ex: BASICAS"
                />
              </div>
              <div>
                <Label>Ordem de Exibição</Label>
                <Input 
                  type="number"
                  value={trilhaForm.ordem}
                  onChange={(e) => setTrilhaForm({...trilhaForm, ordem: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewTrilha(false)}>Cancelar</Button>
              <Button 
                onClick={() => createTrilha.mutate(trilhaForm)}
                disabled={!trilhaForm.name || createTrilha.isPending}
              >
                {createTrilha.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Criar Trilha
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Dialog: Editar Trilha */}
        <Dialog open={!!editingTrilha} onOpenChange={(open) => !open && setEditingTrilha(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Trilha</DialogTitle>
              <DialogDescription>Atualize as informações da trilha</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome da Trilha</Label>
                <Input 
                  value={trilhaForm.name}
                  onChange={(e) => setTrilhaForm({...trilhaForm, name: e.target.value})}
                />
              </div>
              <div>
                <Label>Código</Label>
                <Input 
                  value={trilhaForm.codigo}
                  onChange={(e) => setTrilhaForm({...trilhaForm, codigo: e.target.value.toUpperCase()})}
                />
              </div>
              <div>
                <Label>Ordem de Exibição</Label>
                <Input 
                  type="number"
                  value={trilhaForm.ordem}
                  onChange={(e) => setTrilhaForm({...trilhaForm, ordem: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingTrilha(null)}>Cancelar</Button>
              <Button 
                onClick={() => updateTrilha.mutate({ id: editingTrilha.id, ...trilhaForm })}
                disabled={updateTrilha.isPending}
              >
                {updateTrilha.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Dialog: Nova Competência */}
        <Dialog open={showNewCompetencia} onOpenChange={setShowNewCompetencia}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Competência</DialogTitle>
              <DialogDescription>Adicione uma nova competência ao catálogo</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome da Competência</Label>
                <Input 
                  value={competenciaForm.nome}
                  onChange={(e) => setCompetenciaForm({...competenciaForm, nome: e.target.value})}
                  placeholder="Ex: Comunicação"
                />
              </div>
              <div>
                <Label>Trilha</Label>
                <Select 
                  value={competenciaForm.trilhaId?.toString() || ""} 
                  onValueChange={(v) => setCompetenciaForm({...competenciaForm, trilhaId: parseInt(v)})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a trilha" />
                  </SelectTrigger>
                  <SelectContent>
                    {trilhas?.map((t) => (
                      <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Código de Integração</Label>
                <Input 
                  value={competenciaForm.codigoIntegracao}
                  onChange={(e) => setCompetenciaForm({...competenciaForm, codigoIntegracao: e.target.value.toUpperCase()})}
                  placeholder="Ex: COMUNICACAO"
                />
                <p className="text-xs text-muted-foreground mt-1">Usado para casar com as colunas da planilha de performance</p>
              </div>
              <div>
                <Label>Descrição (opcional)</Label>
                <Textarea 
                  value={competenciaForm.descricao}
                  onChange={(e) => setCompetenciaForm({...competenciaForm, descricao: e.target.value})}
                  placeholder="Descreva a competência..."
                />
              </div>
              <div>
                <Label>Ordem de Exibição</Label>
                <Input 
                  type="number"
                  value={competenciaForm.ordem}
                  onChange={(e) => setCompetenciaForm({...competenciaForm, ordem: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewCompetencia(false)}>Cancelar</Button>
              <Button 
                onClick={() => createCompetencia.mutate(competenciaForm)}
                disabled={!competenciaForm.nome || !competenciaForm.trilhaId || createCompetencia.isPending}
              >
                {createCompetencia.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Criar Competência
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Dialog: Editar Competência */}
        <Dialog open={!!editingCompetencia} onOpenChange={(open) => !open && setEditingCompetencia(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Competência</DialogTitle>
              <DialogDescription>Atualize as informações da competência</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome da Competência</Label>
                <Input 
                  value={competenciaForm.nome}
                  onChange={(e) => setCompetenciaForm({...competenciaForm, nome: e.target.value})}
                />
              </div>
              <div>
                <Label>Trilha</Label>
                <Select 
                  value={competenciaForm.trilhaId?.toString() || ""} 
                  onValueChange={(v) => setCompetenciaForm({...competenciaForm, trilhaId: parseInt(v)})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a trilha" />
                  </SelectTrigger>
                  <SelectContent>
                    {trilhas?.map((t) => (
                      <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Código de Integração</Label>
                <Input 
                  value={competenciaForm.codigoIntegracao}
                  onChange={(e) => setCompetenciaForm({...competenciaForm, codigoIntegracao: e.target.value.toUpperCase()})}
                />
              </div>
              <div>
                <Label>Descrição (opcional)</Label>
                <Textarea 
                  value={competenciaForm.descricao}
                  onChange={(e) => setCompetenciaForm({...competenciaForm, descricao: e.target.value})}
                />
              </div>
              <div>
                <Label>Ordem de Exibição</Label>
                <Input 
                  type="number"
                  value={competenciaForm.ordem}
                  onChange={(e) => setCompetenciaForm({...competenciaForm, ordem: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingCompetencia(null)}>Cancelar</Button>
              <Button 
                onClick={() => updateCompetencia.mutate({ id: editingCompetencia.id, ...competenciaForm })}
                disabled={updateCompetencia.isPending}
              >
                {updateCompetencia.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
