'use client';

import { useMemo, useState } from 'react';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Trash2 } from 'lucide-react';

type TipoAtividade =
  | 'genially'
  | 'video'
  | 'podcast'
  | 'tedtalk'
  | 'livro'
  | 'intro';

const TIPOS_ATIVIDADE: TipoAtividade[] = [
  'genially',
  'video',
  'podcast',
  'tedtalk',
  'livro',
  'intro',
];

function normalizarCompetencia(item: any) {
  return {
    id: Number(item?.id ?? 0),
    nome: item?.nome ?? item?.competencia ?? 'Competência sem nome',
  };
}

function normalizarCurso(item: any) {
  return {
    id: Number(item?.id ?? 0),
    titulo: item?.titulo ?? item?.nome ?? 'Curso sem título',
    descricao: item?.descricao ?? '',
    competenciaId: Number(item?.competenciaId ?? 0),
    isActive: Number(item?.isActive ?? 1),
  };
}

function normalizarAtividade(item: any) {
  return {
    id: Number(item?.id ?? 0),
    cursoId: Number(item?.cursoId ?? 0),
    titulo: item?.titulo ?? 'Atividade sem título',
    tipoAtividade: (item?.tipoAtividade ?? 'video') as TipoAtividade,
    descricao: item?.descricao ?? '',
    urlGenially: item?.urlGenially ?? '',
    ordem: Number(item?.ordem ?? 0),
    isActive: Number(item?.isActive ?? 1),
  };
}

function limparTexto(valor: string) {
  return valor.replace(/\s+/g, ' ').trim();
}

function extrairPrimeiraUrl(texto: string) {
  const match = texto.match(/https?:\/\/[^\s]+/i);
  return match ? match[0].trim() : '';
}

function possuiMaisDeUmaUrl(texto: string) {
  const matches = texto.match(/https?:\/\/[^\s]+/gi);
  return (matches?.length ?? 0) > 1;
}

function validarUrl(url: string) {
  if (!url) return true;

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export default function CompetenciasCompTec() {
  const [selectedCompetenciaId, setSelectedCompetenciaId] = useState<number | null>(null);
  const [cursoDescricao, setCursoDescricao] = useState('');

  const [selectedCursoId, setSelectedCursoId] = useState<number | null>(null);
  const [atividadeTitulo, setAtividadeTitulo] = useState('');
  const [atividadeTipo, setAtividadeTipo] = useState<TipoAtividade>('genially');
  const [atividadeUrl, setAtividadeUrl] = useState('');
  const [atividadeDescricao, setAtividadeDescricao] = useState('');
  const [atividadeOrdem, setAtividadeOrdem] = useState('0');

  const utils = trpc.useUtils();

  const competenciasQuery = trpc.competenciasCompTec.admin.listarCompetencias.useQuery();

  const cursosQuery = trpc.competenciasCompTec.admin.listarCursos.useQuery(
    { competenciaId: selectedCompetenciaId || 0 },
    { enabled: !!selectedCompetenciaId }
  );

  const atividadesQuery = trpc.competenciasCompTec.admin.listarAtividadesCurso.useQuery(
    { cursoId: selectedCursoId || 0 },
    { enabled: !!selectedCursoId }
  );

  const competencias = useMemo(() => {
    const lista = (competenciasQuery.data ?? [])
      .map(normalizarCompetencia)
      .filter((item) => item.id > 0);

    return Array.from(new Map(lista.map((item) => [item.id, item])).values());
  }, [competenciasQuery.data]);

  const cursos = useMemo(() => {
    return (cursosQuery.data ?? [])
      .map(normalizarCurso)
      .filter((item) => item.id > 0);
  }, [cursosQuery.data]);

  const atividades = useMemo(() => {
    return (atividadesQuery.data ?? [])
      .map(normalizarAtividade)
      .filter((item) => item.id > 0);
  }, [atividadesQuery.data]);

  function limparFormularioCurso() {
    setCursoDescricao('');
  }

  function limparFormularioAtividade() {
    setAtividadeTitulo('');
    setAtividadeTipo('genially');
    setAtividadeUrl('');
    setAtividadeDescricao('');
    setAtividadeOrdem('0');
  }

  const criarCursoMutation = trpc.competenciasCompTec.admin.criarCurso.useMutation({
    onSuccess: async () => {
      toast.success('Curso criado com sucesso!');
      limparFormularioCurso();

      if (selectedCompetenciaId) {
        await utils.competenciasCompTec.admin.listarCursos.invalidate({
          competenciaId: selectedCompetenciaId,
        });
        await cursosQuery.refetch();
      }
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar curso: ${error.message}`);
    },
  });

  const criarAtividadeMutation = trpc.competenciasCompTec.admin.criarAtividade.useMutation({
    onSuccess: async () => {
      toast.success('Atividade criada com sucesso!');
      limparFormularioAtividade();

      if (selectedCursoId) {
        await utils.competenciasCompTec.admin.listarAtividadesCurso.invalidate({
          cursoId: selectedCursoId,
        });
        await atividadesQuery.refetch();
      }
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar atividade: ${error.message}`);
    },
  });

  const excluirAtividadeMutation = trpc.competenciasCompTec.admin.excluirAtividade.useMutation({
    onSuccess: async () => {
      toast.success('Atividade removida com sucesso!');

      if (selectedCursoId) {
        await utils.competenciasCompTec.admin.listarAtividadesCurso.invalidate({
          cursoId: selectedCursoId,
        });
        await atividadesQuery.refetch();
      }
    },
    onError: (error: any) => {
      toast.error(`Erro ao remover atividade: ${error.message}`);
    },
  });

  async function handleCriarCurso() {
    if (!selectedCompetenciaId) {
      toast.error('Selecione uma competência.');
      return;
    }

    const competenciaSelecionada = competencias.find(c => c.id === selectedCompetenciaId);
    if (!competenciaSelecionada) {
      toast.error('Competência não encontrada.');
      return;
    }

    await criarCursoMutation.mutateAsync({
      competenciaId: selectedCompetenciaId,
      titulo: competenciaSelecionada.nome,
      descricao: cursoDescricao.trim() || undefined,
    });
  }

  async function handleAdicionarAtividade() {
    if (!selectedCursoId) {
      toast.error('Selecione um curso.');
      return;
    }

    const titulo = limparTexto(atividadeTitulo);
    const descricao = atividadeDescricao.trim();
    const urlExtraida = extrairPrimeiraUrl(atividadeUrl.trim());
    const maisDeUmaUrl = possuiMaisDeUmaUrl(atividadeUrl.trim());

    if (!titulo) {
      toast.error('Preencha o título da atividade.');
      return;
    }

    if (atividadeUrl.trim() && !urlExtraida) {
      toast.error('No campo URL do conteúdo, cole apenas um link válido.');
      return;
    }

    if (urlExtraida && !validarUrl(urlExtraida)) {
      toast.error('A URL informada não é válida.');
      return;
    }

    if (maisDeUmaUrl) {
      toast.warning('Foi detectada mais de uma URL. Apenas a primeira será salva.');
    }

    await criarAtividadeMutation.mutateAsync({
      cursoId: selectedCursoId,
      titulo,
      tipoAtividade: atividadeTipo,
      urlGenially: urlExtraida || undefined,
      descricao: descricao || undefined,
      ordem: Number(atividadeOrdem || 0),
    });
  }

  async function handleRemoverAtividade(atividadeId: number) {
    const confirmar = window.confirm('Tem certeza que deseja remover esta atividade?');
    if (!confirmar) return;

    await excluirAtividadeMutation.mutateAsync({ atividadeId });
  }

  return (
    <div className="space-y-6 p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Competências Comportamentais e Técnicas
        </h1>
        <p className="mt-2 text-gray-600">
          Administração de cursos, conteúdos e estrutura do módulo.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Novo Curso</CardTitle>
            <CardDescription>
              Cadastre um novo curso vinculado a uma competência.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Competência *</label>
              <Select
                value={selectedCompetenciaId ? String(selectedCompetenciaId) : '__none__'}
                onValueChange={(value) => {
                  const novoId = value === '__none__' ? null : Number(value);
                  setSelectedCompetenciaId(novoId);
                  setSelectedCursoId(null);
                  limparFormularioAtividade();
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma competência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Selecione uma competência</SelectItem>
                  {competencias.map((comp) => (
                    <SelectItem key={comp.id} value={String(comp.id)}>
                      {comp.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Descrição</label>
              <Textarea
                placeholder="Descreva o objetivo do curso"
                value={cursoDescricao}
                onChange={(e) => setCursoDescricao(e.target.value)}
                rows={4}
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

            {competenciasQuery.error && (
              <p className="text-sm text-red-600">{competenciasQuery.error.message}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gerenciar Atividades</CardTitle>
            <CardDescription>
              Selecione um curso para adicionar atividades.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Curso *</label>
              <Select
                value={selectedCursoId ? String(selectedCursoId) : '__none__'}
                onValueChange={(value) => {
                  const novoCursoId = value === '__none__' ? null : Number(value);
                  setSelectedCursoId(novoCursoId);
                  limparFormularioAtividade();
                }}
                disabled={!selectedCompetenciaId || cursosQuery.isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um curso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Selecione um curso</SelectItem>
                  {cursos.map((curso) => (
                    <SelectItem key={curso.id} value={String(curso.id)}>
                      {curso.titulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!selectedCompetenciaId && (
              <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                Primeiro selecione uma competência na coluna da esquerda.
              </div>
            )}

            {selectedCompetenciaId && cursosQuery.isLoading && (
              <div className="rounded-md border p-4 text-sm text-muted-foreground">
                Carregando cursos...
              </div>
            )}

            {selectedCompetenciaId && !cursosQuery.isLoading && cursos.length === 0 && (
              <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                Nenhum curso cadastrado. Crie um novo curso na coluna da esquerda.
              </div>
            )}

            {selectedCursoId && (
              <>
                <div>
                  <label className="mb-2 block text-sm font-medium">Título da Atividade *</label>
                  <Input
                    placeholder="Ex: Introdução ao Genially"
                    value={atividadeTitulo}
                    onChange={(e) => setAtividadeTitulo(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Tipo de Conteúdo *</label>
                  <Select
                    value={atividadeTipo}
                    onValueChange={(value) => setAtividadeTipo(value as TipoAtividade)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_ATIVIDADE.map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>
                          {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">URL do Conteúdo</label>
                  <Input
                    placeholder="Cole a URL do conteúdo (Genially, vídeo, etc)"
                    value={atividadeUrl}
                    onChange={(e) => setAtividadeUrl(e.target.value)}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Se colar múltiplas URLs, apenas a primeira será salva.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Descrição</label>
                  <Textarea
                    placeholder="Descreva a atividade"
                    value={atividadeDescricao}
                    onChange={(e) => setAtividadeDescricao(e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Ordem</label>
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
                    'Adicionar Atividade'
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedCursoId && atividades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Atividades do Curso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {atividades.map((atividade) => (
                <div
                  key={atividade.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex-1">
                    <p className="font-medium">{atividade.titulo}</p>
                    <p className="text-sm text-muted-foreground">{atividade.tipoAtividade}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoverAtividade(atividade.id)}
                    disabled={excluirAtividadeMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
