import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import AlunoLayout from "@/components/AlunoLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function normalizarCurso(item: any) {
  const curso = item?.curso ?? item?.modulo ?? item?.programa ?? item ?? {};
  const atribuicao = item?.atribuicao ?? item?.progresso ?? item ?? {};

  return {
    cursoAtribuidoId: Number(atribuicao?.id ?? item?.cursoAtribuidoId ?? item?.id ?? 0),
    cursoId: Number(atribuicao?.cursoId ?? curso?.id ?? item?.cursoId ?? 0),
    titulo: curso?.titulo ?? curso?.nome ?? item?.titulo ?? "Curso sem título",
    descricao: curso?.descricao ?? item?.descricao ?? "",
    status: atribuicao?.status ?? item?.status ?? "nao_iniciado",
    dataPrazo: atribuicao?.dataPrazo ?? item?.dataPrazo ?? null,
    notaFinal: atribuicao?.notaFinal ?? item?.notaFinal ?? null,
  };
}

export default function AlunoCatalogo() {
  const [, setLocation] = useLocation();
  const [busca, setBusca] = useState("");

  const meusCursosQuery = trpc.competenciasCompTec.aluno.getCursosAtribuidos.useQuery();

  const cursos = useMemo(() => {
    const base = (meusCursosQuery.data ?? [])
      .map(normalizarCurso)
      .filter((x) => x.cursoId > 0);

    const termo = busca.trim().toLowerCase();
    if (!termo) return base;

    return base.filter(
      (curso) =>
        curso.titulo.toLowerCase().includes(termo) ||
        curso.descricao.toLowerCase().includes(termo) ||
        curso.status.toLowerCase().includes(termo)
    );
  }, [meusCursosQuery.data, busca]);

  return (
    <AlunoLayout>
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Aluno — Catálogo de Cursos</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Visualize os cursos atribuídos e acompanhe seu desenvolvimento.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buscar curso</CardTitle>
          <CardDescription>Filtre por título, descrição ou status.</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Digite para buscar..."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Meus cursos</CardTitle>
          <CardDescription>
            {meusCursosQuery.isLoading
              ? "Carregando cursos..."
              : `${cursos.length} curso(s) encontrado(s).`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {meusCursosQuery.isLoading ? (
            <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
              Carregando cursos...
            </div>
          ) : meusCursosQuery.error ? (
            <p className="text-sm text-red-600">{meusCursosQuery.error.message}</p>
          ) : cursos.length === 0 ? (
            <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
              Nenhum curso atribuído encontrado.
            </div>
          ) : (
            <div className="grid gap-4">
              {cursos.map((curso) => (
                <div
                  key={`${curso.cursoAtribuidoId}-${curso.cursoId}`}
                  className="rounded-lg border p-4 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold">{curso.titulo}</h3>
                        <span className="rounded-full bg-muted px-2 py-1 text-xs">
                          {curso.status}
                        </span>
                        {curso.notaFinal !== null && curso.notaFinal !== undefined && (
                          <span className="rounded-full bg-muted px-2 py-1 text-xs">
                            Nota final: {String(curso.notaFinal)}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {curso.descricao || "Sem descrição cadastrada."}
                      </p>

                      {curso.dataPrazo ? (
                        <p className="text-xs text-muted-foreground">
                          Prazo: {String(curso.dataPrazo).slice(0, 10)}
                        </p>
                      ) : null}
                    </div>

                    <Button
                      onClick={() =>
                        setLocation(
                          `/aluno/competencias-comp-tec/detalhe?cursoId=${curso.cursoId}&cursoAtribuidoId=${curso.cursoAtribuidoId}`
                        )
                      }
                    >
                      Ver detalhes
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </AlunoLayout>
  );
}
