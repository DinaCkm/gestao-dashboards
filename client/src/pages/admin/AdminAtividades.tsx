import { useMemo, useState } from "react";
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

function normalizarCompetencia(item: any) {
  return {
    id: Number(item?.id ?? 0),
    nome: item?.competencia ?? item?.nome ?? "",
  };
}

function normalizarCurso(item: any) {
  return {
    id: Number(item?.id ?? 0),
    titulo: item?.titulo ?? item?.nome ?? "Curso sem título",
    competencia: item?.competencia ?? item?.nome ?? "Sem competência",
  };
}

function normalizarAtividade(item: any) {
  return {
    id: Number(item?.id ?? 0),
    cursoId: Number(item?.cursoId ?? 0),
    titulo: item?.titulo ?? "Atividade sem título",
    tipoAtividade: (item?.tipoAtividade ?? "video") as TipoAtividade,
    descricao: item?.descricao ?? "",
    urlGenially: item?.urlGenially ?? item?.urlMidia ?? "",
    ordem: Number(item?.ordem ?? 0),
    isActive: Number(item?.isActive ?? 1),
  };
}

export default function AdminAtividades() {
  const [competenciaSelecionadaId, setCompetenciaSelecionadaId] = useState<number>(0);
  const [cursoSelecionado, setCursoSelecionado] = useState<string>("");
  const [atividadeIdEdicao, setAtividadeIdEdicao] = useState<number | null>(null);

  const [formAtividade, setFormAtividade] = useState({
    titulo: "",
    tipoAtividade: "video" as TipoAtividade,
    descricao: "",
    urlGenially: "",
    ordem: "0",
  });

  const utils = trpc.useUtils();

  const competenciasQuery = trpc.competenciasCompTec.admin.listarCompetencias.useQuery();

  const cursosQuery = trpc.competenciasCompTec.admin.listarCursosPorCompetencia.useQuery(
    { competenciaId: competenciaSelecionadaId },
    { enabled: competenciaSelecionadaId > 0 }
  );

  const atividadesQuery = trpc.competenciasCompTec.admin.listarAtividades.useQuery(
    { cursoId: Number(cursoSelecionado || 0) },
    { enabled: !!cursoSelecionado }
  );

  const criarAtividadeMutation = trpc.competenciasCompTec.admin.criarAtividade.useMutation({
    onSuccess: async () => {
      toast.success("Atividade criada com sucesso!");
      limparFormulario();
      if (cursoSelecionado) {
        await utils.competenciasCompTec.admin.listarAtividades.invalidate({
          cursoId: Number(cursoSelecionado),
        });
      }
    },
    onError: (error: any) => {
      toast.error(error?.message || "Erro ao criar atividade");
    },
  });

  const atualizarAtividadeMutation =
    trpc.competenciasCompTec.admin.atualizarAtividade.useMutation({
      onSuccess: async () => {
        toast.success("Atividade atualizada com sucesso!");
        limparFormulario();
        if (cursoSelecionado) {
          await utils.competenciasCompTec.admin.listarAtividades.invalidate({
            cursoId: Number(cursoSelecionado),
          });
        }
      },
      onError: (error: any) => {
        toast.error(error?.message || "Erro ao atualizar atividade");
      },
    });

  const deletarAtividadeMutation =
    trpc.competenciasCompTec.admin.deletarAtividade.useMutation({
      onSuccess: async () => {
        toast.success("Atividade desativada com sucesso!");
        if (cursoSelecionado) {
          await utils.competenciasCompTec.admin.listarAtividades.invalidate({
            cursoId: Number(cursoSelecionado),
          });
        }
      },
      onError: (error: any) => {
        toast.error(error?.message || "Erro ao desativar atividade");
      },
    });

  const competencias = useMemo(() => {
    return (competenciasQuery.data ?? [])
      .map(normalizarCompetencia)
      .filter((x) => x.id > 0)
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [competenciasQuery.data]);

  const cursos = useMemo(
    () => (cursosQuery.data ?? []).map(normalizarCurso).filter((x) => x.id > 0),
    [cursosQuery.data]
  );

  const atividades = useMemo(
    () => (atividadesQuery.data ?? []).map(normalizarAtividade).filter((x) => x.id > 0),
    [atividadesQuery.data]
  );

  function limparFormulario() {
    setAtividadeIdEdicao(null);
    setFormAtividade({
      titulo: "",
      tipoAtividade: "video",
      descricao: "",
      urlGenially: "",
      ordem: "0",
    });
  }

  function preencherEdicao(atividade: ReturnType<typeof normalizarAtividade>) {
    setAtividadeIdEdicao(atividade.id);
    setFormAtividade({
      titulo: atividade.titulo,
      tipoAtividade: atividade.tipoAtividade,
      descricao: atividade.descricao,
      urlGenially: atividade.urlGenially,
      ordem: String(atividade.ordem ?? 0),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSalvarAtividade(e: React.FormEvent) {
    e.preventDefault();

    if (!cursoSelecionado) {
      toast.error("Selecione um curso");
      return;
    }

    const payload = {
      cursoId: Number(cursoSelecionado),
      titulo: formAtividade.titulo.trim(),
      tipoAtividade: formAtividade.tipoAtividade,
      descricao: formAtividade.descricao.trim(),
      urlGenially: formAtividade.urlGenially.trim(),
      ordem: Number(formAtividade.ordem || 0),
    };

    if (!payload.titulo) {
      toast.error("Informe o título da atividade");
      return;
    }

    if (atividadeIdEdicao) {
      await atualizarAtividadeMutation.mutateAsync({
        id: atividadeIdEdicao,
        titulo: payload.titulo,
        tipoAtividade: payload.tipoAtividade,
        descricao: payload.descricao,
        urlGenially: payload.urlGenially,
        ordem: payload.ordem,
      });
      return;
    }

    await criarAtividadeMutation.mutateAsync(payload);
  }

  async function handleDeletarAtividade(id: number) {
    const confirmar = window.confirm("Deseja realmente desativar esta atividade?");
    if (!confirmar) return;

    await deletarAtividadeMutation.mutateAsync({ id });
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Administração de Atividades</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Cadastre, edite e organize as atividades vinculadas aos cursos de competências.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{atividadeIdEdicao ? "Editar atividade" : "Nova atividade"}</CardTitle>
            <CardDescription>
              Selecione primeiro a competência e o curso para cadastrar a atividade.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSalvarAtividade} className="space-y-4">
              <div className="space-y-2">
                <Label>Competência</Label>
                <Select
                  value={String(competenciaSelecionadaId || "__none__")}
                  onValueChange={(value) => {
                    const novaCompetenciaId = value === "__none__" ? 0 : Number(value);
                    setCompetenciaSelecionadaId(novaCompetenciaId);
                    setCursoSelecionado("");
                    limparFormulario();
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione a competência" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Selecione</SelectItem>
                    {competencias.map((competencia) => (
                      <SelectItem key={competencia.id} value={String(competencia.id)}>
                        {competencia.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Curso</Label>
                <Select
                  value={cursoSelecionado || "__none__"}
                  onValueChange={(value) => {
                    const novoCurso = value === "__none__" ? "" : value;
                    setCursoSelecionado(novoCurso);
                    limparFormulario();
                  }}
                  disabled={competenciaSelecionadaId <= 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o curso" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Selecione</SelectItem>
                    {cursos.map((curso) => (
                      <SelectItem key={curso.id} value={String(curso.id)}>
                        {curso.titulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="titulo">Título da atividade</Label>
                <Input
                  id="titulo"
                  value={formAtividade.titulo}
                  onChange={(e) =>
                    setFormAtividade((prev) => ({ ...prev, titulo: e.target.value }))
                  }
                  placeholder="Digite o título da atividade"
                  required
                  disabled={!cursoSelecionado}
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de atividade</Label>
                <Select
                  value={formAtividade.tipoAtividade}
                  onValueChange={(value: TipoAtividade) =>
                    setFormAtividade((prev) => ({ ...prev, tipoAtividade: value }))
                  }
                  disabled={!cursoSelecionado}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_ATIVIDADE.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formAtividade.descricao}
                  onChange={(e) =>
                    setFormAtividade((prev) => ({ ...prev, descricao: e.target.value }))
                  }
                  placeholder="Descreva a atividade"
                  rows={4}
                  disabled={!cursoSelecionado}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="urlGenially">URL do conteúdo</Label>
                  <Input
                    id="urlGenially"
                    value={formAtividade.urlGenially}
                    onChange={(e) =>
                      setFormAtividade((prev) => ({ ...prev, urlGenially: e.target.value }))
                    }
                    placeholder="https://..."
                    disabled={!cursoSelecionado}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ordem">Ordem</Label>
                  <Input
                    id="ordem"
                    type="number"
                    value={formAtividade.ordem}
                    onChange={(e) =>
                      setFormAtividade((prev) => ({ ...prev, ordem: e.target.value }))
                    }
                    disabled={!cursoSelecionado}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  type="submit"
                  disabled={
                    !cursoSelecionado ||
                    criarAtividadeMutation.isPending ||
                    atualizarAtividadeMutation.isPending
                  }
                >
                  {atividadeIdEdicao ? "Salvar alterações" : "Criar atividade"}
                </Button>

                <Button type="button" variant="outline" onClick={limparFormulario}>
                  Limpar
                </Button>
              </div>

              {(criarAtividadeMutation.error || atualizarAtividadeMutation.error) && (
                <p className="text-sm text-red-600">
                  {criarAtividadeMutation.error?.message ||
                    atualizarAtividadeMutation.error?.message ||
                    "Não foi possível salvar a atividade."}
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
            <CardDescription>
              Selecione competência e curso para gerenciar as atividades.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="rounded-md border p-4 text-sm text-muted-foreground">
              {competenciasQuery.isLoading
                ? "Carregando competências..."
                : `${competenciasUnicas.length} competência(s) encontrada(s).`}
            </div>

            <div className="rounded-md border p-4 text-sm text-muted-foreground">
              {!competenciaSelecionada
                ? "Escolha uma competência para listar os cursos."
                : cursosQuery.isLoading
                ? "Carregando cursos..."
                : `${cursos.length} curso(s) encontrado(s) para a competência selecionada.`}
            </div>

            <div className="rounded-md border p-4 text-sm text-muted-foreground">
              {!cursoSelecionado
                ? "Escolha um curso para visualizar as atividades."
                : atividadesQuery.isLoading
                ? "Carregando atividades..."
                : `${atividades.length} atividade(s) encontrada(s) para o curso selecionado.`}
            </div>

            {competenciasQuery.error && (
              <p className="text-sm text-red-600">{competenciasQuery.error.message}</p>
            )}
            {cursosQuery.error && (
              <p className="text-sm text-red-600">{cursosQuery.error.message}</p>
            )}
            {atividadesQuery.error && (
              <p className="text-sm text-red-600">{atividadesQuery.error.message}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Atividades cadastradas</CardTitle>
          <CardDescription>
            {cursoSelecionado
              ? "Gerencie as atividades do curso selecionado."
              : "Selecione um curso acima para listar as atividades."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {!cursoSelecionado ? (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              Escolha um curso para visualizar as atividades.
            </div>
          ) : atividadesQuery.isLoading ? (
            <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
              Carregando atividades...
            </div>
          ) : atividades.length === 0 ? (
            <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
              Nenhuma atividade encontrada para este curso.
            </div>
          ) : (
            <div className="grid gap-4">
              {atividades.map((atividade) => (
                <div
                  key={atividade.id}
                  className="rounded-lg border p-4 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold">{atividade.titulo}</h3>
                        <span className="rounded-full bg-muted px-2 py-1 text-xs">
                          {atividade.tipoAtividade}
                        </span>
                        <span className="rounded-full bg-muted px-2 py-1 text-xs">
                          Ordem {atividade.ordem}
                        </span>
                        <span className="rounded-full bg-muted px-2 py-1 text-xs">
                          {atividade.isActive === 1 ? "Ativa" : "Inativa"}
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {atividade.descricao || "Sem descrição cadastrada."}
                      </p>

                      {atividade.urlGenially ? (
                        <a
                          href={atividade.urlGenially}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block text-sm text-primary underline"
                        >
                          Abrir conteúdo
                        </a>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Sem URL cadastrada.
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={() => preencherEdicao(atividade)}>
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleDeletarAtividade(atividade.id)}
                        disabled={deletarAtividadeMutation.isPending}
                      >
                        Desativar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {deletarAtividadeMutation.error && (
            <p className="mt-4 text-sm text-red-600">
              {deletarAtividadeMutation.error.message}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
