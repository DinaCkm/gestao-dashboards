import { useState } from 'react';
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
import { Loader2, Eye, EyeOff } from 'lucide-react';

export default function CompetenciasCompTec() {
  const [selectedCompetenciaId, setSelectedCompetenciaId] = useState<number | null>(null);
  const [cursoTitulo, setCursoTitulo] = useState('');
  const [cursoDescricao, setCursoDescricao] = useState('');

  // Queries
  const { data: competencias = [] } = trpc.competenciasCompTec.admin.listarCompetencias.useQuery();
  
  const { data: cursos = [] } = trpc.competenciasCompTec.admin.listarCursos.useQuery(
    { competenciaId: selectedCompetenciaId || 0 },
    { enabled: !!selectedCompetenciaId }
  );

  // Mutations
  const utils = trpc.useUtils();
  
  const criarCursoMutation = trpc.competenciasCompTec.admin.criarCurso.useMutation({
    onSuccess: async () => {
      toast.success('Curso criado com sucesso!');
      await utils.competenciasCompTec.admin.listarCursos.invalidate({
        competenciaId: selectedCompetenciaId!,
      });
      setCursoTitulo('');
      setCursoDescricao('');
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar curso: ${error.message}`);
    },
  });

  const inativarCursoMutation = trpc.competenciasCompTec.admin.inativarCurso.useMutation({
    onSuccess: async () => {
      toast.success('Curso inativado com sucesso!');
      await utils.competenciasCompTec.admin.listarCursos.invalidate({
        competenciaId: selectedCompetenciaId!,
      });
    },
    onError: (error: any) => {
      toast.error(`Erro ao inativar curso: ${error.message}`);
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

        {/* SEÇÃO 2: LISTAR CURSOS */}
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
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => inativarCursoMutation.mutateAsync({ cursoId: curso.id })}
                        disabled={inativarCursoMutation.isPending}
                        className="ml-2"
                      >
                        {curso.isActive ? (
                          <>
                            <Eye className="h-4 w-4" />
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-4 w-4" />
                          </>
                        )}
                      </Button>
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
              onClick={() => window.location.href = "/admin/competencias-comp-tec/atividades"}
            >
              Abrir Administração de Atividades
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
