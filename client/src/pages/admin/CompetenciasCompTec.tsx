'use client';

import { useState, useEffect } from 'react';
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
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Edit2 } from 'lucide-react';

export default function CompetenciasCompTec() {
  const [selectedCompetencia, setSelectedCompetencia] = useState<string>('');
  
  // Debug
  useEffect(() => {
    console.log('selectedCompetencia mudou para:', selectedCompetencia);
  }, [selectedCompetencia]);
  const [cursoTitulo, setCursoTitulo] = useState('');
  const [cursoDescricao, setCursoDescricao] = useState('');
  const [selectedCurso, setSelectedCurso] = useState<number | null>(null);
  const [atividadeTitulo, setAtividadeTitulo] = useState('');
  const [atividadeTipo, setAtividadeTipo] = useState('genially');
  const [atividadeUrl, setAtividadeUrl] = useState('');
  const [atividadeDescricao, setAtividadeDescricao] = useState('');
  const [atividadeOrdem, setAtividadeOrdem] = useState('0');

  // Queries
  const { data: competencias = [] } = trpc.competenciasCompTec.admin.listarCompetencias.useQuery();
  const { data: cursos = [] } = trpc.competenciasCompTec.admin.listarCursos.useQuery(
    { competenciaId: selectedCompetencia ? parseInt(selectedCompetencia) : undefined },
    { enabled: !!selectedCompetencia }
  );
  const { data: atividades = [] } = trpc.competenciasCompTec.admin.listarAtividadesCurso.useQuery(
    { cursoId: selectedCurso || 0 },
    { enabled: !!selectedCurso }
  );

  // Mutations
  const criarCursoMutation = trpc.competenciasCompTec.admin.criarCurso.useMutation({
    onSuccess: () => {
      toast.success('Curso criado com sucesso!');
      setCursoTitulo('');
      setCursoDescricao('');
      setSelectedCompetencia('');
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar curso: ${error.message}`);
    },
  });

  const criarAtividadeMutation = trpc.competenciasCompTec.admin.criarAtividade.useMutation({
    onSuccess: () => {
      toast.success('Atividade adicionada com sucesso!');
      setAtividadeTitulo('');
      setAtividadeUrl('');
      setAtividadeDescricao('');
      setAtividadeOrdem('0');
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar atividade: ${error.message}`);
    },
  });

  const excluirAtividadeMutation = trpc.competenciasCompTec.admin.excluirAtividade.useMutation({
    onSuccess: () => {
      toast.success('Atividade removida com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao remover atividade: ${error.message}`);
    },
  });

  const handleCriarCurso = async () => {
    if (!selectedCompetencia || !cursoTitulo) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    console.log('selectedCompetencia:', selectedCompetencia, 'tipo:', typeof selectedCompetencia);
    console.log('parseInt(selectedCompetencia):', parseInt(selectedCompetencia));

    await criarCursoMutation.mutateAsync({
      competenciaId: parseInt(selectedCompetencia),
      titulo: cursoTitulo,
      descricao: cursoDescricao || undefined,
    });
  };

  const handleAdicionarAtividade = async () => {
    if (!selectedCurso || !atividadeTitulo || !atividadeTipo) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    await criarAtividadeMutation.mutateAsync({
      cursoId: selectedCurso,
      titulo: atividadeTitulo,
      tipoAtividade: atividadeTipo as any,
      urlGenially: atividadeUrl || undefined,
      descricao: atividadeDescricao || undefined,
      ordem: parseInt(atividadeOrdem) || 0,
    });
  };

  const handleRemoverAtividade = async (atividadeId: number) => {
    if (confirm('Tem certeza que deseja remover esta atividade?')) {
      await excluirAtividadeMutation.mutateAsync({ atividadeId });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Competências Comportamentais e Técnicas</h1>
        <p className="text-gray-600 mt-2">Administração de cursos, conteúdos e estrutura do módulo.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SEÇÃO 1: CRIAR CURSO */}
        <Card>
          <CardHeader>
            <CardTitle>Novo Curso</CardTitle>
            <CardDescription>Cadastre um novo curso vinculado a uma competência.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Competência *</label>
              <Select value={selectedCompetencia} onValueChange={setSelectedCompetencia}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma competência" />
                </SelectTrigger>
                <SelectContent>
                  {competencias && competencias.length > 0 ? (
                    Array.from(new Map(competencias.map((comp: any) => [comp.id, comp])).values()).map((comp: any) => (
                      comp && comp.id ? (
                        <SelectItem key={comp.id} value={comp.id.toString()}>
                          {comp.nome}
                        </SelectItem>
                      ) : null
                    ))
                  ) : null}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Título do Curso *</label>
              <Input
                placeholder="Digite o título do curso"
                value={cursoTitulo}
                onChange={(e) => setCursoTitulo(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Descrição</label>
              <Textarea
                placeholder="Descreva o objetivo do curso"
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

        {/* SEÇÃO 2: GERENCIAR ATIVIDADES */}
        <Card>
          <CardHeader>
            <CardTitle>Gerenciar Atividades</CardTitle>
            <CardDescription>Selecione um curso para adicionar atividades.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedCompetencia ? (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Selecione um Curso</label>
                  <Select value={selectedCurso?.toString() || ''} onValueChange={(val) => setSelectedCurso(parseInt(val) || null)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um curso" />
                    </SelectTrigger>
                    <SelectContent>
                      {cursos && cursos.length > 0 && cursos.map((curso: any) => (
                        <SelectItem key={curso.id} value={curso.id.toString()}>
                          {curso.titulo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedCurso && (
                  <>
                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-3">Adicionar Atividade</h3>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium mb-2">Título da Atividade *</label>
                          <Input
                            placeholder="Ex: Filme - Introdução"
                            value={atividadeTitulo}
                            onChange={(e) => setAtividadeTitulo(e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Tipo de Conteúdo *</label>
                          <Select value={atividadeTipo} onValueChange={setAtividadeTipo}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="genially">Genially</SelectItem>
                              <SelectItem value="video">Vídeo</SelectItem>
                              <SelectItem value="podcast">Podcast</SelectItem>
                              <SelectItem value="tedtalk">TED Talk</SelectItem>
                              <SelectItem value="livro">Livro</SelectItem>
                              <SelectItem value="texto">Texto</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">URL do Conteúdo</label>
                          <Input
                            placeholder="https://view.genially.com/..."
                            value={atividadeUrl}
                            onChange={(e) => setAtividadeUrl(e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Descrição</label>
                          <Textarea
                            placeholder="Descrição da atividade"
                            value={atividadeDescricao}
                            onChange={(e) => setAtividadeDescricao(e.target.value)}
                            rows={2}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Ordem</label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={atividadeOrdem}
                            onChange={(e) => setAtividadeOrdem(e.target.value)}
                          />
                        </div>

                        <Button
                          onClick={handleAdicionarAtividade}
                          disabled={criarAtividadeMutation.isPending}
                          className="w-full"
                        >
                          {criarAtividadeMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Adicionando...
                            </>
                          ) : (
                            <>
                              <Plus className="mr-2 h-4 w-4" />
                              Adicionar Atividade
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* LISTA DE ATIVIDADES */}
                    {atividades.length > 0 && (
                      <div className="border-t pt-4">
                        <h3 className="font-semibold mb-3">Atividades do Curso</h3>
                        <div className="space-y-2">
                          {atividades.map((atividade: any) => (
                            <div
                              key={atividade.id}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded"
                            >
                              <div className="flex-1">
                                <p className="font-medium text-sm">{atividade.titulo}</p>
                                <p className="text-xs text-gray-600">{atividade.tipoAtividade}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoverAtividade(atividade.id)}
                                disabled={excluirAtividadeMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-600">Selecione uma competência acima para gerenciar atividades.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
