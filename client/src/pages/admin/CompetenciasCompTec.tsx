"use client";
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Edit2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

type TipoAtividade = "genially" | "video" | "podcast" | "tedtalk" | "livro" | "intro";

const TIPOS_ATIVIDADE: TipoAtividade[] = [
  "genially",
  "video",
  "podcast",
  "tedtalk",
  "livro",
  "intro",
];

export default function CompetenciasCompTec() {
  const [competenciaSelecionada, setCompetenciaSelecionada] = useState<string>("");
  const [cursoEmEdicao, setCursoEmEdicao] = useState<any>(null);
  const [cursoExpandido, setCursoExpandido] = useState<number | null>(null);
  const [mostraFormAtividade, setMostraFormAtividade] = useState(false);

  // FORMULÁRIO DE CURSO
  const [formCurso, setFormCurso] = useState({
    competencia: "",
    titulo: "",
    descricao: "",
  });

  // FORMULÁRIO DE ATIVIDADE
  const [formAtividade, setFormAtividade] = useState({
    titulo: "",
    tipoAtividade: "genially" as TipoAtividade,
    urlGenially: "",
    descricao: "",
    ordem: "0",
  });

  const utils = trpc.useUtils();

  // QUERIES
  const competenciasQuery = trpc.competenciasCompTec.admin.listarCompetencias.useQuery();

  const cursosQuery = trpc.competenciasCompTec.admin.listarCursosPorCompetencia.useQuery(
    { competencia: competenciaSelecionada },
    { enabled: !!competenciaSelecionada }
  );

  // MUTATIONS - CURSOS
  const criarCursoMutation = trpc.competenciasCompTec.admin.criarCurso.useMutation({
    onSuccess: async () => {
      toast.success("Curso criado com sucesso!");
      limparFormCurso();
      await utils.competenciasCompTec.admin.listarCursosPorCompetencia.invalidate({
        competencia: competenciaSelecionada,
      });
    },
    onError: (error) => {
      toast.error(`Erro ao criar curso: ${error.message}`);
    },
  });

  const atualizarCursoMutation = trpc.competenciasCompTec.admin.atualizarCurso.useMutation({
    onSuccess: async () => {
      toast.success("Curso atualizado com sucesso!");
      limparFormCurso();
      setCursoEmEdicao(null);
      await utils.competenciasCompTec.admin.listarCursosPorCompetencia.invalidate({
        competencia: competenciaSelecionada,
      });
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar curso: ${error.message}`);
    },
  });

  const excluirCursoMutation = trpc.competenciasCompTec.admin.excluirCurso.useMutation({
    onSuccess: async () => {
      toast.success("Curso excluído com sucesso!");
      await utils.competenciasCompTec.admin.listarCursosPorCompetencia.invalidate({
        competencia: competenciaSelecionada,
      });
    },
    onError: (error) => {
      toast.error(`Erro ao excluir curso: ${error.message}`);
    },
  });

  // MUTATIONS - ATIVIDADES
  const criarAtividadeMutation = trpc.competenciasCompTec.admin.criarAtividade.useMutation({
    onSuccess: async () => {
      toast.success("Atividade adicionada com sucesso!");
      limparFormAtividade();
      setMostraFormAtividade(false);
      // Recarregar cursos para atualizar a lista de atividades
      await utils.competenciasCompTec.admin.listarCursosPorCompetencia.invalidate({
        competencia: competenciaSelecionada,
      });
    },
    onError: (error) => {
      toast.error(`Erro ao criar atividade: ${error.message}`);
    },
  });

  // HELPERS
  const competenciasUnicas = useMemo(() => {
    const lista = (competenciasQuery.data ?? [])
      .map((item: any) => item.competencia)
      .filter(Boolean);
    return Array.from(new Set(lista));
  }, [competenciasQuery.data]);

  function limparFormCurso() {
    setFormCurso({
      competencia: "",
      titulo: "",
      descricao: "",
    });
    setCursoEmEdicao(null);
  }

  function limparFormAtividade() {
    setFormAtividade({
      titulo: "",
      tipoAtividade: "genially",
      urlGenially: "",
      descricao: "",
      ordem: "0",
    });
  }

  function handleEditarCurso(curso: any) {
    setCursoEmEdicao(curso);
    setFormCurso({
      competencia: curso.competencia,
      titulo: curso.titulo,
      descricao: curso.descricao,
    });
  }

  function handleSalvarCurso() {
    if (!formCurso.competencia || !formCurso.titulo) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    if (cursoEmEdicao) {
      atualizarCursoMutation.mutate({
        id: cursoEmEdicao.id,
        titulo: formCurso.titulo,
        descricao: formCurso.descricao,
      });
    } else {
      criarCursoMutation.mutate({
        competencia: formCurso.competencia,
        titulo: formCurso.titulo,
        descricao: formCurso.descricao,
      });
    }
  }

  function handleSalvarAtividade() {
    if (!cursoEmEdicao || !formAtividade.titulo || !formAtividade.urlGenially) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    criarAtividadeMutation.mutate({
      cursoId: cursoEmEdicao.id,
      titulo: formAtividade.titulo,
      tipoAtividade: formAtividade.tipoAtividade,
      urlGenially: formAtividade.urlGenially,
      descricao: formAtividade.descricao || undefined,
      ordem: parseInt(formAtividade.ordem),
    });
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Competências Comportamentais e Técnicas</h1>
        <p className="text-gray-600">Administração de cursos, conteúdos e estrutura do módulo.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* COLUNA 1: CRIAR/EDITAR CURSO */}
        <Card>
          <CardHeader>
            <CardTitle>{cursoEmEdicao ? "Editar Curso" : "Novo Curso"}</CardTitle>
            <CardDescription>
              {cursoEmEdicao
                ? "Atualize os dados do curso"
                : "Cadastre um novo curso vinculado a uma competência."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="competencia">Competência *</Label>
              <Select
                value={formCurso.competencia}
                onValueChange={(value) =>
                  setFormCurso({ ...formCurso, competencia: value })
                }
                disabled={!!cursoEmEdicao}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma competência" />
                </SelectTrigger>
                <SelectContent>
                  {competenciasUnicas.map((comp) => (
                    <SelectItem key={comp} value={comp}>
                      {comp}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="titulo">Título do Curso *</Label>
              <Input
                id="titulo"
                placeholder="Digite o título do curso"
                value={formCurso.titulo}
                onChange={(e) =>
                  setFormCurso({ ...formCurso, titulo: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                placeholder="Descreva o objetivo do curso"
                value={formCurso.descricao}
                onChange={(e) =>
                  setFormCurso({ ...formCurso, descricao: e.target.value })
                }
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSalvarCurso}
                disabled={criarCursoMutation.isPending || atualizarCursoMutation.isPending}
              >
                {cursoEmEdicao ? "Atualizar Curso" : "Criar Curso"}
              </Button>
              {cursoEmEdicao && (
                <Button
                  variant="outline"
                  onClick={() => {
                    limparFormCurso();
                    setCursoExpandido(null);
                  }}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* COLUNA 2: LISTAR CURSOS E ATIVIDADES */}
        <Card>
          <CardHeader>
            <CardTitle>Cursos Cadastrados</CardTitle>
            <CardDescription>Selecione uma competência para listar os cursos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="competencia-filtro">Competência</Label>
              <Select
                value={competenciaSelecionada}
                onValueChange={(value) => {
                  setCompetenciaSelecionada(value);
                  setCursoEmEdicao(null);
                  setMostraFormAtividade(false);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma competência" />
                </SelectTrigger>
                <SelectContent>
                  {competenciasUnicas.map((comp) => (
                    <SelectItem key={comp} value={comp}>
                      {comp}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {cursosQuery.isLoading && <p className="text-gray-500">Carregando cursos...</p>}

            {cursosQuery.data && cursosQuery.data.length === 0 && (
              <p className="text-gray-500">Nenhum curso encontrado.</p>
            )}

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {cursosQuery.data?.map((curso: any) => (
                <div key={curso.id} className="border rounded-lg bg-gray-50">
                  <div
                    className="flex justify-between items-center p-3 cursor-pointer hover:bg-gray-100"
                    onClick={() =>
                      setCursoExpandido(
                        cursoExpandido === curso.id ? null : curso.id
                      )
                    }
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{curso.titulo}</h3>
                      <p className="text-xs text-gray-600">{curso.descricao}</p>
                    </div>
                    <div className="flex gap-1 items-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditarCurso(curso);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          excluirCursoMutation.mutate({ id: curso.id });
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      {cursoExpandido === curso.id ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>

                  {/* ATIVIDADES DO CURSO */}
                  {cursoExpandido === curso.id && (
                    <div className="border-t p-3 space-y-3 bg-white">
                      {curso.atividades && curso.atividades.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-gray-700">
                            Atividades ({curso.atividades.length}):
                          </p>
                          {curso.atividades.map(
                            (atividade: any, idx: number) => (
                              <div
                                key={atividade.id}
                                className="text-xs bg-gray-50 p-2 rounded border"
                              >
                                <div className="font-semibold">
                                  {idx + 1}. {atividade.titulo}
                                </div>
                                <div className="text-gray-600">
                                  Tipo: {atividade.tipoAtividade}
                                </div>
                                <div className="text-gray-600 truncate">
                                  URL: {atividade.urlGenially}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500">
                          Nenhuma atividade adicionada
                        </p>
                      )}

                      {/* FORM PARA ADICIONAR ATIVIDADE */}
                      {cursoEmEdicao?.id === curso.id &&
                      mostraFormAtividade ? (
                        <div className="space-y-3 border-t pt-3">
                          <h4 className="font-semibold text-sm">
                            Adicionar Atividade
                          </h4>

                          <div>
                            <Label htmlFor="titulo-atividade">
                              Título da Atividade *
                            </Label>
                            <Input
                              id="titulo-atividade"
                              placeholder="Ex: Filme - Visão Estratégica"
                              value={formAtividade.titulo}
                              onChange={(e) =>
                                setFormAtividade({
                                  ...formAtividade,
                                  titulo: e.target.value,
                                })
                              }
                            />
                          </div>

                          <div>
                            <Label htmlFor="tipo">Tipo de Atividade *</Label>
                            <Select
                              value={formAtividade.tipoAtividade}
                              onValueChange={(value) =>
                                setFormAtividade({
                                  ...formAtividade,
                                  tipoAtividade: value as TipoAtividade,
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {TIPOS_ATIVIDADE.map((tipo) => (
                                  <SelectItem key={tipo} value={tipo}>
                                    {tipo.charAt(0).toUpperCase() +
                                      tipo.slice(1)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="url-genially">
                              URL do Genially/Conteúdo *
                            </Label>
                            <Input
                              id="url-genially"
                              placeholder="https://view.genially.com/..."
                              value={formAtividade.urlGenially}
                              onChange={(e) =>
                                setFormAtividade({
                                  ...formAtividade,
                                  urlGenially: e.target.value,
                                })
                              }
                            />
                          </div>

                          <div>
                            <Label htmlFor="descricao-atividade">
                              Descrição
                            </Label>
                            <Textarea
                              id="descricao-atividade"
                              placeholder="Descrição da atividade (opcional)"
                              value={formAtividade.descricao}
                              onChange={(e) =>
                                setFormAtividade({
                                  ...formAtividade,
                                  descricao: e.target.value,
                                })
                              }
                            />
                          </div>

                          <div>
                            <Label htmlFor="ordem-atividade">Ordem</Label>
                            <Input
                              id="ordem-atividade"
                              type="number"
                              value={formAtividade.ordem}
                              onChange={(e) =>
                                setFormAtividade({
                                  ...formAtividade,
                                  ordem: e.target.value,
                                })
                              }
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={handleSalvarAtividade}
                              disabled={criarAtividadeMutation.isPending}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Adicionar Atividade
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                limparFormAtividade();
                                setMostraFormAtividade(false);
                              }}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        cursoEmEdicao?.id === curso.id && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() => setMostraFormAtividade(true)}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Adicionar Atividade
                          </Button>
                        )
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
