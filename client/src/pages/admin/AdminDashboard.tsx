import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  ClipboardList,
  FileCheck,
  LayoutDashboard,
  GraduationCap,
  ArrowRight,
} from "lucide-react";

function DashboardContent() {
  const [, setLocation] = useLocation();
  const [competenciaSelecionada, setCompetenciaSelecionada] = useState<number | null>(null);

  const competenciasQuery = trpc.competenciasCompTec.admin.listarCompetencias.useQuery();

  const cursosQuery = trpc.competenciasCompTec.admin.listarCursos.useQuery(
    { competenciaId: competenciaSelecionada ? parseInt(competenciaSelecionada) : undefined },
    { enabled: !!competenciaSelecionada }
  );

  const cursos = cursosQuery.data ?? [];
  const avaliacoesCursoIds = useMemo(() => cursos.map((c: any) => Number(c?.id ?? 0)).filter(Boolean), [cursos]);

  const avaliacoesQueries = trpc.useQueries((t) =>
    avaliacoesCursoIds.map((cursoId) =>
      t.competenciasCompTec.admin.listarAvaliacoesCurso({ cursoId })
    )
  );

  const competencias = useMemo(() => {
    const lista = (competenciasQuery.data ?? [])
      .map((item: any) => ({ id: item?.id, nome: item?.nome }))
      .filter((item) => item.id && item.nome);
    return lista;
  }, [competenciasQuery.data]);

  const totalCompetencias = competencias.length;
  const totalCursos = cursos.length;

  const totalAvaliacoes = useMemo(() => {
    return avaliacoesQueries.reduce((acc, query) => {
      const data = Array.isArray(query.data) ? query.data : [];
      return acc + data.length;
    }, 0);
  }, [avaliacoesQueries]);

  const carregandoAvaliacoes = avaliacoesQueries.some((q) => q.isLoading);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-background p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-primary/10 p-3">
            <LayoutDashboard className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Dashboard Administrativo — Competências Comportamentais e Técnicas
            </h1>
            <p className="text-sm text-muted-foreground">
              Painel central para acompanhar competências, cursos, atividades e avaliações do módulo.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Competências</CardDescription>
            <CardTitle className="text-3xl">{competenciasQuery.isLoading ? "..." : totalCompetencias}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <GraduationCap className="h-4 w-4" />
              <span>Competências disponíveis no módulo</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Cursos da competência selecionada</CardDescription>
            <CardTitle className="text-3xl">
              {!competenciaSelecionada || cursosQuery.isLoading ? "..." : totalCursos}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              <span>{competenciaSelecionada || "Selecione uma competência abaixo"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Avaliações vinculadas</CardDescription>
            <CardTitle className="text-3xl">
              {!competenciaSelecionada || carregandoAvaliacoes ? "..." : totalAvaliacoes}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileCheck className="h-4 w-4" />
              <span>Avaliações encontradas nos cursos da seleção</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtro rápido por competência</CardTitle>
          <CardDescription>
            Selecione uma competência para visualizar o volume de cursos e avaliações relacionado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {competenciasQuery.isLoading ? (
            <div className="rounded-md border p-6 text-sm text-muted-foreground">
              Carregando competências...
            </div>
          ) : competencias.length === 0 ? (
            <div className="rounded-md border p-6 text-sm text-muted-foreground">
              Nenhuma competência encontrada.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {competencias.map((competencia) => (
                <Button
                  key={competencia}
                  type="button"
                  variant={competenciaSelecionada === competencia.id ? "default" : "outline"}
                  onClick={() =>
                    setCompetenciaSelecionada((prev) =>
                      prev === competencia.id ? null : competencia.id
                    )
                  }
                >
                  {competencia.nome}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Gestão de cursos</CardTitle>
            <CardDescription>
              Cadastre, edite e organize cursos vinculados às competências.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border p-4 text-sm text-muted-foreground">
              Use esta área para estruturar o catálogo do módulo.
            </div>
            <Button className="w-full" onClick={() => setLocation("/competencias-comp-tec")}>
              Acessar gestão de cursos
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Gestão de atividades</CardTitle>
            <CardDescription>
              Crie atividades por curso e organize a ordem de execução.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border p-4 text-sm text-muted-foreground">
              Controle os conteúdos do tipo vídeo, genially, podcast, TEDTalk, livro e texto.
            </div>
            <Button className="w-full" onClick={() => setLocation("/admin/competencias-comp-tec/atividades")}>
              Acessar atividades
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Gestão de avaliações</CardTitle>
            <CardDescription>
              Cadastre avaliações com banco de 30 questões.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border p-4 text-sm text-muted-foreground">
              O aluno responde 15 questões aleatórias e precisa de nota mínima 8.
            </div>
            <Button className="w-full" onClick={() => setLocation("/admin/competencias-comp-tec/avaliacoes")}>
              Acessar avaliações
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumo operacional</CardTitle>
          <CardDescription>
            Acompanhamento rápido da estrutura configurada para a competência selecionada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!competenciaSelecionada ? (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              Selecione uma competência para visualizar o resumo.
            </div>
          ) : cursosQuery.isLoading ? (
            <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
              Carregando resumo...
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-4">
                <div className="mb-2 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <h3 className="font-medium">Cursos</h3>
                </div>
                <p className="text-2xl font-bold">{totalCursos}</p>
                <p className="text-sm text-muted-foreground">
                  Cursos ativos encontrados para {competenciaSelecionada}.
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <div className="mb-2 flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  <h3 className="font-medium">Avaliações</h3>
                </div>
                <p className="text-2xl font-bold">
                  {carregandoAvaliacoes ? "..." : totalAvaliacoes}
                </p>
                <p className="text-sm text-muted-foreground">
                  Avaliações vinculadas aos cursos dessa competência.
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <div className="mb-2 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  <h3 className="font-medium">Regra do módulo</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Banco com 30 questões, 15 sorteadas para o aluno e nota mínima 8.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminCompTecDashboard() {
  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  );
}
