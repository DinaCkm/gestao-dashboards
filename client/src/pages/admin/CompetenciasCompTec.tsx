import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff, ArrowLeft, Edit2, Trash2, BookOpen, FileText, Video, Headphones, Mic, BookMarked, Play, X } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

// Mapa de ícones e labels para tipos de atividade
const TIPO_ATIVIDADE_MAP: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  genially: { label: 'Genially', icon: <Play className="h-4 w-4" />, color: 'bg-purple-100 text-purple-800' },
  video: { label: 'Vídeo', icon: <Video className="h-4 w-4" />, color: 'bg-blue-100 text-blue-800' },
  podcast: { label: 'Podcast', icon: <Headphones className="h-4 w-4" />, color: 'bg-green-100 text-green-800' },
  tedtalk: { label: 'TED Talk', icon: <Mic className="h-4 w-4" />, color: 'bg-red-100 text-red-800' },
  livro: { label: 'Livro', icon: <BookMarked className="h-4 w-4" />, color: 'bg-amber-100 text-amber-800' },
  intro: { label: 'Introdução', icon: <FileText className="h-4 w-4" />, color: 'bg-gray-100 text-gray-800' },
};

export default function CompetenciasCompTec() {
  const [, setLocation] = useLocation();
  const [selectedCompetenciaId, setSelectedCompetenciaId] = useState<number | null>(null);
  const [cursoTitulo, setCursoTitulo] = useState('');
  const [cursoDescricao, setCursoDescricao] = useState('');
  const [viewCursoId, setViewCursoId] = useState<number | null>(null);
  const [viewCursoOpen, setViewCursoOpen] = useState(false);

  // Queries
  const { data: competencias = [] } = trpc.competenciasCompTec.admin.listarCompetencias.useQuery();
  
  const { data: cursos = [] } = trpc.competenciasCompTec.admin.listarCursos.useQuery(
    { competenciaId: selectedCompetenciaId || 0 },
    { enabled: !!selectedCompetenciaId }
  );

  // Query para listar TODOS os cursos
  const { data: todosCursos = [] } = trpc.competenciasCompTec.admin.listarTodosCursos.useQuery();

  // Query para atividades do curso selecionado para visualização
  const { data: viewAtividades = [], isLoading: loadingAtividades } = trpc.competenciasCompTec.admin.listarAtividades.useQuery(
    { cursoId: viewCursoId || 0 },
    { enabled: !!viewCursoId && viewCursoOpen }
  );

  // Query para avaliações do curso selecionado para visualização
  const { data: viewAvaliacoes = [], isLoading: loadingAvaliacoes } = trpc.competenciasCompTec.admin.listarAvaliacoesCurso.useQuery(
    { cursoId: viewCursoId || 0 },
    { enabled: !!viewCursoId && viewCursoOpen }
  );

  // Mutations
  const utils = trpc.useUtils();
  
  const criarCursoMutation = trpc.competenciasCompTec.admin.criarCurso.useMutation({
    onSuccess: async () => {
      toast.success('Curso criado com sucesso!');
      await utils.competenciasCompTec.admin.listarCursos.invalidate({
        competenciaId: selectedCompetenciaId!,
      });
      await utils.competenciasCompTec.admin.listarTodosCursos.invalidate();
      setCursoTitulo('');
      setCursoDescricao('');
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar curso: ${error.message}`);
    },
  });

  const excluirCursoMutation = trpc.competenciasCompTec.admin.excluirCurso.useMutation({
    onSuccess: async () => {
      toast.success('Status do curso alterado com sucesso!');
      if (selectedCompetenciaId) {
        await utils.competenciasCompTec.admin.listarCursos.invalidate({
          competenciaId: selectedCompetenciaId,
        });
      }
      await utils.competenciasCompTec.admin.listarTodosCursos.invalidate();
    },
    onError: (error: any) => {
      toast.error(`Erro ao alterar status do curso: ${error.message}`);
    },
  });

  const handleCriarCurso = async () => {
    if (!selectedCompetenciaId || !cursoTitulo) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    await criarCursoMutation.mutateAsync({
      competenciaId: selectedCompetenciaId,
      titulo: cursoTitulo,
      descricao: cursoDescricao || undefined,
    });
  };

  // Abrir visualização completa do curso
  const handleViewCurso = (cursoId: number) => {
    setViewCursoId(cursoId);
    setViewCursoOpen(true);
  };

  // Dados do curso selecionado para visualização
  const viewCurso = todosCursos.find((c: any) => c.id === viewCursoId);
  const viewCompetencia = viewCurso ? competencias.find((c: any) => c.id === viewCurso.competenciaId) : null;

  return (
    <div className="space-y-6 p-6">
      {/* Header com título e botão voltar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Criação e Gerenciamento de Cursos</h1>
          <p className="text-gray-600 mt-2">Administração de cursos, conteúdos e estrutura do módulo.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLocation("/dashboard/admin")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SEÇÃO 1: CRIAR CURSO */}
        <Card>
          <CardHeader>
            <CardTitle>Criar Novo Curso</CardTitle>
            <CardDescription>Adicione um novo curso a uma competência.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Selecione uma Competência *</label>
              <Select 
                value={selectedCompetenciaId?.toString() || ''} 
                onValueChange={(val) => setSelectedCompetenciaId(parseInt(val) || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma competência" />
                </SelectTrigger>
                <SelectContent>
                  {competencias && competencias.length > 0 && competencias.map((comp: any) => (
                    <SelectItem key={comp.id} value={comp.id.toString()}>
                      {comp.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Título do Curso *</label>
              <Input
                placeholder="Ex: Introdução à Liderança"
                value={cursoTitulo}
                onChange={(e) => setCursoTitulo(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Descrição</label>
              <Textarea
                placeholder="Descreva o curso"
                value={cursoDescricao}
                onChange={(e) => setCursoDescricao(e.target.value)}
              />
            </div>

            <Button
              onClick={handleCriarCurso}
              disabled={criarCursoMutation.isPending}
              className="w-full"
            >
              {criarCursoMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Curso'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* SEÇÃO 2: LISTAR CURSOS DA COMPETÊNCIA SELECIONADA */}
        <Card>
          <CardHeader>
            <CardTitle>Cursos Cadastrados</CardTitle>
            <CardDescription>
              {selectedCompetenciaId ? 'Cursos da competência selecionada' : 'Selecione uma competência'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedCompetenciaId ? (
              cursos && cursos.length > 0 ? (
                <div className="space-y-2">
                  {cursos.map((curso: any) => (
                    <div key={curso.id} className="p-3 bg-gray-50 rounded flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{curso.titulo}</p>
                        {curso.descricao && (
                          <p className="text-xs text-gray-600 mt-1">{curso.descricao}</p>
                        )}
                        {!curso.isActive && (
                          <p className="text-xs text-red-600 mt-1 font-semibold">Inativo</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewCurso(curso.id)}
                          title="Visualizar curso completo"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => excluirCursoMutation.mutateAsync({ cursoId: curso.id })}
                          disabled={excluirCursoMutation.isPending}
                          className="ml-1"
                          title={curso.isActive ? 'Inativar' : 'Inativado'}
                        >
                          {curso.isActive ? (
                            <EyeOff className="h-4 w-4 text-red-500" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600">Nenhum curso cadastrado para esta competência</p>
              )
            ) : (
              <p className="text-sm text-gray-600">Selecione uma competência para ver seus cursos</p>
            )}
          </CardContent>
        </Card>

        {/* SEÇÃO 3: GERENCIAR ATIVIDADES */}
        <Card>
          <CardHeader>
            <CardTitle>Gerenciar Atividades</CardTitle>
            <CardDescription>
              O cadastro de atividades agora é feito em uma tela dedicada.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              Para evitar erros e manter o fluxo correto, use a tela exclusiva de atividades.
            </div>

            <Button
              type="button"
              className="w-full"
              onClick={() => setLocation("/admin/competencias-comp-tec/atividades")}
            >
              Abrir Administração de Atividades
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* SEÇÃO 4: VISUALIZAÇÃO DE TODOS OS CURSOS */}
      <Card>
        <CardHeader>
          <CardTitle>Todos os Cursos Criados</CardTitle>
          <CardDescription>
            Visualize, edite ou inative todos os cursos do sistema. Clique no ícone de olho para ver o curso completo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todosCursos && todosCursos.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Competência</TableHead>
                    <TableHead>Título do Curso</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...todosCursos].sort((a: any, b: any) => {
                    // Ativos primeiro, depois inativos
                    if (b.isActive !== a.isActive) return b.isActive - a.isActive;
                    // Dentro de cada grupo, ordenar por nome da competência
                    const compA = competencias.find((c: any) => c.id === a.competenciaId)?.nome || '';
                    const compB = competencias.find((c: any) => c.id === b.competenciaId)?.nome || '';
                    const cmpComp = compA.localeCompare(compB, 'pt-BR');
                    if (cmpComp !== 0) return cmpComp;
                    // Depois por título do curso
                    return (a.titulo || '').localeCompare(b.titulo || '', 'pt-BR');
                  }).map((curso: any) => {
                    const competencia = competencias.find((c: any) => c.id === curso.competenciaId);
                    return (
                      <TableRow key={curso.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleViewCurso(curso.id)}>
                        <TableCell className="font-medium">
                          {competencia?.nome || `Competência ${curso.competenciaId}`}
                        </TableCell>
                        <TableCell>{curso.titulo}</TableCell>
                        <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                          {curso.descricao || '-'}
                        </TableCell>
                        <TableCell>
                          {curso.isActive ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Inativo
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewCurso(curso.id)}
                            title="Visualizar curso completo"
                          >
                            <Eye className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedCompetenciaId(curso.competenciaId);
                              toast.info('Competência selecionada. Edite o curso na seção acima.');
                            }}
                            title="Editar"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => excluirCursoMutation.mutateAsync({ cursoId: curso.id })}
                            disabled={excluirCursoMutation.isPending}
                            title={curso.isActive ? 'Inativar curso' : 'Curso inativo'}
                          >
                            {curso.isActive ? (
                              <EyeOff className="h-4 w-4 text-red-500" />
                            ) : (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-gray-600 text-center py-8">Nenhum curso criado ainda</p>
          )}
        </CardContent>
      </Card>

      {/* DIALOG: VISUALIZAÇÃO COMPLETA DO CURSO */}
      <Dialog open={viewCursoOpen} onOpenChange={(open) => {
        if (!open) {
          setTimeout(() => {
            setViewCursoOpen(false);
            setViewCursoId(null);
          }, 100);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              {viewCurso?.titulo || 'Curso'}
            </DialogTitle>
            <DialogDescription>
              Visualização completa do curso com atividades e avaliações
            </DialogDescription>
          </DialogHeader>

          {viewCurso && (
            <div className="space-y-6 mt-4">
              {/* Informações gerais do curso */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 font-medium uppercase">Competência</p>
                  <p className="text-sm font-semibold mt-1">{viewCompetencia?.nome || `ID ${viewCurso.competenciaId}`}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 font-medium uppercase">Status</p>
                  <div className="mt-1">
                    {viewCurso.isActive ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Inativo
                      </span>
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 font-medium uppercase">Ordem</p>
                  <p className="text-sm font-semibold mt-1">{viewCurso.ordem ?? 0}</p>
                </div>
              </div>

              {viewCurso.descricao && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-xs text-blue-600 font-medium uppercase mb-1">Descrição</p>
                  <p className="text-sm text-gray-700">{viewCurso.descricao}</p>
                </div>
              )}

              {/* Seção de Atividades */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-600" />
                  Atividades do Curso
                  <Badge variant="secondary" className="ml-2">{viewAtividades.length}</Badge>
                </h3>

                {loadingAtividades ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-sm text-gray-500">Carregando atividades...</span>
                  </div>
                ) : viewAtividades.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Título</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>URL/Link</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {viewAtividades.map((atividade: any, index: number) => {
                          const tipoInfo = TIPO_ATIVIDADE_MAP[atividade.tipoAtividade] || { label: atividade.tipoAtividade, icon: <FileText className="h-4 w-4" />, color: 'bg-gray-100 text-gray-800' };
                          return (
                            <TableRow key={atividade.id}>
                              <TableCell className="text-gray-500 font-mono text-xs">
                                {atividade.ordem ?? index + 1}
                              </TableCell>
                              <TableCell className="font-medium">{atividade.titulo}</TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${tipoInfo.color}`}>
                                  {tipoInfo.icon}
                                  {tipoInfo.label}
                                </span>
                              </TableCell>
                              <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                                {atividade.descricao || '-'}
                              </TableCell>
                              <TableCell className="text-sm max-w-xs truncate">
                                {atividade.urlGenially || atividade.urlMidia ? (
                                  <a
                                    href={atividade.urlGenially || atividade.urlMidia}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline text-xs"
                                  >
                                    Abrir link
                                  </a>
                                ) : (
                                  <span className="text-gray-400 text-xs">-</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Nenhuma atividade cadastrada neste curso</p>
                  </div>
                )}
              </div>

              {/* Seção de Avaliações */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-orange-600" />
                  Avaliações do Curso
                  <Badge variant="secondary" className="ml-2">{viewAvaliacoes.length}</Badge>
                </h3>

                {loadingAvaliacoes ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-sm text-gray-500">Carregando avaliações...</span>
                  </div>
                ) : viewAvaliacoes.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead>Título da Avaliação</TableHead>
                          <TableHead>Atividade Vinculada</TableHead>
                          <TableHead>Nota Mínima</TableHead>
                          <TableHead>Questões</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {viewAvaliacoes.map((item: any) => {
                          const avaliacao = item.avaliacao;
                          const atividade = item.atividade;
                          let numQuestoes = 0;
                          try {
                            const questoes = typeof avaliacao.questoes === 'string' ? JSON.parse(avaliacao.questoes) : avaliacao.questoes;
                            numQuestoes = Array.isArray(questoes) ? questoes.length : 0;
                          } catch { numQuestoes = 0; }

                          return (
                            <TableRow key={avaliacao.id}>
                              <TableCell className="font-medium">{avaliacao.titulo}</TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {atividade?.titulo || `Atividade ${avaliacao.atividadeId}`}
                              </TableCell>
                              <TableCell>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                  {avaliacao.notaMinima ?? 8}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm font-mono">{numQuestoes}</span>
                              </TableCell>
                              <TableCell>
                                {avaliacao.isActive ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Ativa
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    Inativa
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <BookOpen className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Nenhuma avaliação cadastrada neste curso</p>
                  </div>
                )}
              </div>

              {/* Resumo / Indicadores */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Resumo do Curso</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-blue-700">{viewAtividades.length}</p>
                    <p className="text-xs text-blue-600 mt-1">Atividades</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-orange-700">{viewAvaliacoes.length}</p>
                    <p className="text-xs text-orange-600 mt-1">Avaliações</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-purple-700">
                      {viewAtividades.reduce((acc: Record<string, boolean>, a: any) => { acc[a.tipoAtividade] = true; return acc; }, {} as Record<string, boolean>) && Object.keys(viewAtividades.reduce((acc: Record<string, boolean>, a: any) => { acc[a.tipoAtividade] = true; return acc; }, {} as Record<string, boolean>)).length}
                    </p>
                    <p className="text-xs text-purple-600 mt-1">Tipos de Conteúdo</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-700">
                      {viewAtividades.filter((a: any) => a.urlGenially || a.urlMidia).length}
                    </p>
                    <p className="text-xs text-green-600 mt-1">Com Link/URL</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
