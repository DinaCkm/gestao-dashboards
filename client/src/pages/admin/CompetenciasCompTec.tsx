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

type TipoConteudo = "genially" | "video" | "podcast" | "tedtalk" | "livro" | "texto";

const TIPOS_CONTEUDO: TipoConteudo[] = [
  "genially",
  "video",
  "podcast",
  "tedtalk",
  "livro",
  "texto",
];

export default function CompetenciasCompTec() {
  const [competenciaSelecionada, setCompetenciaSelecionada] = useState<string>("");
  const [cursoIdEdicao, setCursoIdEdicao] = useState<number | null>(null);

  const [formCurso, setFormCurso] = useState({
    competencia: "",
    titulo: "",
    descricao: "",
    tipoConteudo: "video" as TipoConteudo,
    urlConteudo: "",
    ordem: "0",
    ativo: "1",
  });

  const utils = trpc.useUtils();

  const competenciasQuery = trpc.competenciasCompTec.admin.listarCompetencias.useQuery();

  const cursosQuery = trpc.competenciasCompTec.admin.listarCursosPorCompetencia.useQuery(
    { competencia: competenciaSelecionada },
    { enabled: !!competenciaSelecionada }
  );

  const criarCursoMutation = trpc.competenciasCompTec.admin.criarCurso.useMutation({
    onSuccess: async () => {
      limparFormulario();
      await utils.competenciasCompTec.admin.listarCompetencias.invalidate();
      if (competenciaSelecionada) {
        await utils.competenciasCompTec.admin.listarCursosPorCompetencia.invalidate({
          competencia: competenciaSelecionada,
        });
      }
    },
  });

  const atualizarCursoMutation = trpc.competenciasCompTec.admin.atualizarCurso.useMutation({
    onSuccess: async () => {
      limparFormulario();
      await utils.competenciasCompTec.admin.listarCompetencias.invalidate();
      if (competenciaSelecionada) {
        await utils.competenciasCompTec.admin.listarCursosPorCompetencia.invalidate({
          competencia: competenciaSelecionada,
        });
      }
    },
  });

  const excluirCursoMutation = trpc.competenciasCompTec.admin.excluirCurso.useMutation({
    onSuccess: async () => {
      await utils.competenciasCompTec.admin.listarCompetencias.invalidate();
      if (competenciaSelecionada) {
        await utils.competenciasCompTec.admin.listarCursosPorCompetencia.invalidate({
          competencia: competenciaSelecionada,
        });
      }
    },
  });

  const competenciasUnicas = useMemo(() => {
    const lista = (competenciasQuery.data ?? [])
      .map((item: any) => item.competencia)
      .filter(Boolean);

    return Array.from(new Set(lista));
  }, [competenciasQuery.data]);

  function limparFormulario() {
    setCursoIdEdicao(null);
    setFormCurso({
      competencia: "",
      titulo: "",
      descricao: "",
      tipoConteudo: "video",
      urlConteudo: "",
      ordem: "0",
      ativo: "1",
    });
  }

  function preencherEdicao(curso: any) {
    setCursoIdEdicao(curso.id);
    setFormCurso({
      competencia: curso.competencia ?? "",
      titulo: curso.titulo ?? "",
      descricao: curso.descricao ?? "",
      tipoConteudo: (curso.tipoConteudo ?? "video") as TipoConteudo,
      urlConteudo: curso.urlConteudo ?? "",
      ordem: String(curso.ordem ?? 0),
      ativo: String(curso.isActive ?? 1),
    });
    setCompetenciaSelecionada(curso.competencia ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSalvarCurso(e: React.FormEvent) {
    e.preventDefault();

    const payload = {
      competencia: formCurso.competencia,
      titulo: formCurso.titulo,
      descricao: formCurso.descricao,
      tipoConteudo: formCurso.tipoConteudo,
      urlConteudo: formCurso.urlConteudo,
      ordem: Number(formCurso.ordem || 0),
      ativo: Number(formCurso.ativo || 1),
    };

    if (cursoIdEdicao) {
      await atualizarCursoMutation.mutateAsync({
        cursoId: cursoIdEdicao,
        ...payload,
      });
      return;
    }

    await criarCursoMutation.mutateAsync(payload);
    if (payload.competencia) {
      setCompetenciaSelecionada(payload.competencia);
    }
  }

  async function handleExcluirCurso(cursoId: number) {
    const confirmar = window.confirm("Deseja realmente desativar este curso?");
    if (!confirmar) return;
    await excluirCursoMutation.mutateAsync({ cursoId });
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Competências Comportamentais e Técnicas</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Administração de cursos, conteúdos e estrutura do módulo.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{cursoIdEdicao ? "Editar curso" : "Novo curso"}</CardTitle>
            <CardDescription>
              Cadastre ou atualize um curso vinculado a uma competência.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSalvarCurso} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="competencia">Competência</Label>
                <Input
                  id="competencia"
                  value={formCurso.competencia}
                  onChange={(e) =>
                    setFormCurso((prev) => ({ ...prev, competencia: e.target.value }))
                  }
                  placeholder="Ex.: Comunicação, Liderança, Planejamento"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="titulo">Título do curso</Label>
                <Input
                  id="titulo"
                  value={formCurso.titulo}
                  onChange={(e) =>
                    setFormCurso((prev) => ({ ...prev, titulo: e.target.value }))
                  }
                  placeholder="Digite o título do curso"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formCurso.descricao}
                  onChange={(e) =>
                    setFormCurso((prev) => ({ ...prev, descricao: e.target.value }))
                  }
                  placeholder="Descreva o objetivo do curso"
                  rows={4}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tipo de conteúdo</Label>
                  <Select
                    value={formCurso.tipoConteudo}
                    onValueChange={(value: TipoConteudo) =>
                      setFormCurso((prev) => ({ ...prev, tipoConteudo: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_CONTEUDO.map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>
                          {tipo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="urlConteudo">URL do conteúdo</Label>
                  <Input
                    id="urlConteudo"
                    value={formCurso.urlConteudo}
                    onChange={(e) =>
                      setFormCurso((prev) => ({ ...prev, urlConteudo: e.target.value }))
                    }
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ordem">Ordem</Label>
                  <Input
                    id="ordem"
                    type="number"
                    value={formCurso.ordem}
                    onChange={(e) =>
                      setFormCurso((prev) => ({ ...prev, ordem: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formCurso.ativo}
                    onValueChange={(value) =>
                      setFormCurso((prev) => ({ ...prev, ativo: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Ativo</SelectItem>
                      <SelectItem value="0">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  type="submit"
                  disabled={
                    criarCursoMutation.isPending || atualizarCursoMutation.isPending
                  }
                >
                  {cursoIdEdicao ? "Salvar alterações" : "Criar curso"}
                </Button>

                <Button type="button" variant="outline" onClick={limparFormulario}>
                  Limpar
                </Button>
              </div>

              {(criarCursoMutation.error || atualizarCursoMutation.error) && (
                <p className="text-sm text-red-600">
                  {criarCursoMutation.error?.message ||
                    atualizarCursoMutation.error?.message ||
                    "Não foi possível salvar o curso."}
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Filtrar cursos por competência</CardTitle>
            <CardDescription>
              Selecione uma competência para visualizar os cursos cadastrados.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Competência</Label>
              <Select
                value={competenciaSelecionada || "__none__"}
                onValueChange={(value) =>
                  setCompetenciaSelecionada(value === "__none__" ? "" : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma competência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Todas / nenhuma selecionada</SelectItem>
                  {competenciasUnicas.map((competencia) => (
                    <SelectItem key={competencia} value={competencia}>
                      {competencia}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border p-4 text-sm text-muted-foreground">
              {competenciasQuery.isLoading
                ? "Carregando competências..."
                : competenciasUnicas.length > 0
                ? `${competenciasUnicas.length} competência(s) encontrada(s).`
                : "Nenhuma competência encontrada."}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cursos cadastrados</CardTitle>
          <CardDescription>
            {competenciaSelecionada
              ? `Cursos vinculados à competência: ${competenciaSelecionada}`
              : "Selecione uma competência acima para listar os cursos."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!competenciaSelecionada ? (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              Escolha uma competência para visualizar os cursos.
            </div>
          ) : cursosQuery.isLoading ? (
            <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
              Carregando cursos...
            </div>
          ) : (cursosQuery.data ?? []).length === 0 ? (
            <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
              Nenhum curso encontrado para esta competência.
            </div>
          ) : (
            <div className="grid gap-4">
              {(cursosQuery.data ?? []).map((curso: any) => (
                <div
                  key={curso.id}
                  className="rounded-lg border p-4 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold">{curso.titulo}</h3>
                        <span className="rounded-full bg-muted px-2 py-1 text-xs">
                          {curso.tipoConteudo}
                        </span>
                        <span className="rounded-full bg-muted px-2 py-1 text-xs">
                          Ordem {curso.ordem ?? 0}
                        </span>
                        <span className="rounded-full bg-muted px-2 py-1 text-xs">
                          {Number(curso.isActive ?? 1) === 1 ? "Ativo" : "Inativo"}
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {curso.descricao || "Sem descrição cadastrada."}
                      </p>

                      {curso.urlConteudo ? (
                        <a
                          href={curso.urlConteudo}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block text-sm text-primary underline"
                        >
                          Abrir conteúdo
                        </a>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Sem URL de conteúdo cadastrada.
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={() => preencherEdicao(curso)}>
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleExcluirCurso(curso.id)}
                        disabled={excluirCursoMutation.isPending}
                      >
                        Desativar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {cursosQuery.error && (
            <p className="mt-4 text-sm text-red-600">{cursosQuery.error.message}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
